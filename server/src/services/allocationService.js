import DamageReport from '../models/DamageReport.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import { createNotification, notifySupervisors } from './notificationService.js';
import { logAudit } from './auditService.js';

// Haversine distance in kilometers
export const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return 15.0; // Reasonable fallback distance within district
  }

  const R = 6371; // Earth's radius in km
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

// Target completion SLA calculator
export const getTargetCompletionDate = (severity) => {
  const now = new Date();
  switch (severity?.toLowerCase()) {
    case 'critical':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    case 'high':
      return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    case 'medium':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    case 'low':
    default:
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  }
};

/**
 * Real automatic worker allocation service with scoring, SLA prioritization,
 * and atomic concurrency locking to guarantee zero duplicate assignments.
 */
export const allocateWorkerToReport = async (reportId, triggeringUser = null) => {
  // 1. Fetch report and check eligibility
  const report = await DamageReport.findById(reportId);
  if (!report) {
    throw new Error(`Report not found with ID: ${reportId}`);
  }

  if (report.status !== 'pending_assignment' && report.status !== 'unassigned') {
    return {
      success: false,
      message: `Report ${report.reportNumber} is in status '${report.status}' and not eligible for auto-assignment.`
    };
  }

  const reportCoords = report.location?.coordinates || { lat: 13.0827, lng: 80.2707 };
  const serviceArea = report.location?.serviceArea || 'Central District';

  // Extract required skills and equipment from AI analysis detections
  const requiredSkills = new Set();
  const requiredEquipment = new Set();
  if (report.aiAnalysis?.detections && report.aiAnalysis.detections.length > 0) {
    report.aiAnalysis.detections.forEach((d) => {
      d.required_skills?.forEach((s) => requiredSkills.add(s));
      d.required_equipment?.forEach((e) => requiredEquipment.add(e));
    });
  }

  // 2. Filter candidate workers by:
  // - Role is 'worker'
  // - Active status: active === true
  // - Service area match
  // - Availability status: available or on_duty
  // - Has available capacity: currentActiveJobs < maxConcurrentJobs
  const candidateWorkers = await User.find({
    role: 'worker',
    active: true,
    serviceArea: serviceArea,
    'workerProfile.availabilityStatus': { $in: ['available', 'on_duty'] },
    $expr: {
      $lt: ['$workerProfile.currentActiveJobs', '$workerProfile.maxConcurrentJobs']
    }
  });

  // If no candidate workers in service area, check without strict serviceArea restriction as secondary pool
  let workerPool = candidateWorkers;
  if (workerPool.length === 0) {
    workerPool = await User.find({
      role: 'worker',
      active: true,
      'workerProfile.availabilityStatus': { $in: ['available', 'on_duty'] },
      $expr: {
        $lt: ['$workerProfile.currentActiveJobs', '$workerProfile.maxConcurrentJobs']
      }
    });
  }

  // 3. If still no eligible workers, transition to 'unassigned', notify supervisors, and return
  if (workerPool.length === 0) {
    report.status = 'unassigned';
    report.statusHistory.push({
      status: 'unassigned',
      changedBy: triggeringUser?._id || null,
      changedByName: triggeringUser?.name || 'System Auto-Engine',
      note: 'Automatic allocation found no eligible workers with available capacity in service area.',
      timestamp: new Date()
    });
    await report.save();

    await notifySupervisors(
      serviceArea,
      `Unassigned Road Damage Alert: ${report.reportNumber}`,
      `Report ${report.reportNumber} (${report.priority} severity) could not be automatically dispatched due to worker capacity limits. Manual dispatch required.`,
      report._id
    );

    await logAudit({
      action: 'ALLOCATION_FAILED_NO_WORKERS',
      entityType: 'Report',
      entityId: report._id,
      user: triggeringUser,
      details: { serviceArea, priority: report.priority }
    });

    return {
      success: false,
      status: 'unassigned',
      message: `No available maintenance workers in ${serviceArea}. Report placed in Unassigned queue.`
    };
  }

  // 4. Calculate weighted scores for each eligible worker
  // Configurable weights: 50% proximity, 30% available capacity, 20% skill & equipment match
  const scoredWorkers = workerPool.map((worker) => {
    const profile = worker.workerProfile || {};
    const workerCoords = profile.currentCoordinates || { lat: 13.0827, lng: 80.2707 };

    // Proximity (50%): 0km => 100pts, 50km+ => 0pts
    const distanceKm = calculateHaversineDistanceKm(
      reportCoords.lat,
      reportCoords.lng,
      workerCoords.lat,
      workerCoords.lng
    );
    const proximityScore = Math.max(0, Math.min(100, Math.round(100 - distanceKm * 2)));

    // Capacity (30%): remaining capacity percentage
    const maxJobs = profile.maxConcurrentJobs || 3;
    const activeJobs = profile.currentActiveJobs || 0;
    const capacityScore = Math.max(0, Math.min(100, Math.round(((maxJobs - activeJobs) / maxJobs) * 100)));

    // Skill & Equipment match (20%)
    let skillScore = 100;
    const totalRequirements = requiredSkills.size + requiredEquipment.size;
    if (totalRequirements > 0) {
      let matchedCount = 0;
      requiredSkills.forEach((reqSkill) => {
        if (profile.skills?.includes(reqSkill)) matchedCount++;
      });
      requiredEquipment.forEach((reqEquip) => {
        if (profile.equipment?.includes(reqEquip)) matchedCount++;
      });
      skillScore = Math.round((matchedCount / totalRequirements) * 100);
    }

    // Total Composite Allocation Score
    const totalScore = Math.round(
      0.50 * proximityScore +
      0.30 * capacityScore +
      0.20 * skillScore
    );

    return {
      worker,
      distanceKm,
      proximityScore,
      capacityScore,
      skillScore,
      totalScore
    };
  });

  // Sort descending by total composite score
  scoredWorkers.sort((a, b) => b.totalScore - a.totalScore);
  const bestCandidate = scoredWorkers[0];
  const selectedWorker = bestCandidate.worker;

  // 5. ATOMIC RACE-CONDITION LOCK:
  // Atomically claim the report only if status is still 'pending_assignment' or 'unassigned'.
  // This guarantees that concurrent allocation triggers cannot double-assign!
  const targetCompletionDate = getTargetCompletionDate(report.priority);

  const lockedReport = await DamageReport.findOneAndUpdate(
    {
      _id: reportId,
      status: { $in: ['pending_assignment', 'unassigned'] }
    },
    {
      status: 'assigned',
      $push: {
        statusHistory: {
          status: 'assigned',
          changedBy: triggeringUser?._id || null,
          changedByName: triggeringUser?.name || 'System Auto-Engine',
          note: `Automatically assigned to ${selectedWorker.name} (Score: ${bestCandidate.totalScore}/100, Distance: ${bestCandidate.distanceKm} km).`,
          timestamp: new Date()
        }
      }
    },
    { new: true }
  );

  if (!lockedReport) {
    return {
      success: false,
      message: 'Report assignment was completed concurrently by another dispatch event.'
    };
  }

  // 6. Create Assignment record
  const assignment = await Assignment.create({
    reportId: lockedReport._id,
    workerId: selectedWorker._id,
    assignedBy: triggeringUser?._id || null,
    assignedByType: triggeringUser ? 'supervisor_override' : 'system_auto_allocator',
    scoreBreakdown: {
      proximityScore: bestCandidate.proximityScore,
      capacityScore: bestCandidate.capacityScore,
      skillScore: bestCandidate.skillScore,
      totalScore: bestCandidate.totalScore,
      distanceKm: bestCandidate.distanceKm
    },
    status: 'assigned',
    targetCompletionDate: targetCompletionDate,
    assignedAt: new Date()
  });

  // Link assignment to report
  lockedReport.currentAssignment = assignment._id;
  await lockedReport.save();

  // Increment worker's active job counter
  await User.findByIdAndUpdate(selectedWorker._id, {
    $inc: { 'workerProfile.currentActiveJobs': 1 },
    $set: { 'workerProfile.availabilityStatus': 'busy' }
  });

  // 7. Send notification to the allocated worker
  await createNotification({
    recipientId: selectedWorker._id,
    title: `New Job Assignment: ${lockedReport.reportNumber}`,
    message: `You have been assigned to repair road damage at ${lockedReport.location.address} (${lockedReport.priority} priority). Target SLA: ${targetCompletionDate.toLocaleDateString()}.`,
    type: 'assignment',
    relatedReportId: lockedReport._id
  });

  // 8. Record immutable audit log
  await logAudit({
    action: 'WORKER_ALLOCATED',
    entityType: 'Assignment',
    entityId: assignment._id,
    user: triggeringUser,
    details: {
      reportNumber: lockedReport.reportNumber,
      workerId: selectedWorker._id,
      workerName: selectedWorker.name,
      score: bestCandidate.totalScore,
      distanceKm: bestCandidate.distanceKm,
      priority: lockedReport.priority
    }
  });

  return {
    success: true,
    status: 'assigned',
    assignment,
    selectedWorker: {
      id: selectedWorker._id,
      name: selectedWorker.name,
      email: selectedWorker.email,
      phone: selectedWorker.phone
    },
    scoreBreakdown: bestCandidate
  };
};
