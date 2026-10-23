import express from 'express';
import DamageReport from '../models/DamageReport.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import { protect } from '../middleware/auth.js';
import { enforceServiceArea } from '../middleware/rbac.js';

const router = express.Router();

// @route   GET /api/analytics
// @desc    Real database-aggregated system metrics and operational reports
router.get('/', protect, enforceServiceArea, async (req, res, next) => {
  try {
    const query = {};
    if (req.serviceAreaFilter) {
      query['location.serviceArea'] = req.serviceAreaFilter;
    }

    // 1. Core Summary Metrics
    const totalReports = await DamageReport.countDocuments(query);
    const verifiedReports = await DamageReport.countDocuments({ ...query, status: 'verified' });
    const pendingReview = await DamageReport.countDocuments({ ...query, status: 'review_required' });
    const unassignedCount = await DamageReport.countDocuments({ ...query, status: 'unassigned' });
    const activeRepairs = await DamageReport.countDocuments({
      ...query,
      status: { $in: ['assigned', 'accepted', 'in_progress', 'reopened'] }
    });
    const pendingVerification = await DamageReport.countDocuments({ ...query, status: 'completed' });

    // 2. Breakdown by Severity / Priority
    const severityAggregation = await DamageReport.aggregate([
      { $match: query },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const severityBreakdown = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    severityAggregation.forEach((item) => {
      if (item._id && severityBreakdown.hasOwnProperty(item._id)) {
        severityBreakdown[item._id] = item.count;
      }
    });

    // 3. Breakdown by Status
    const statusAggregation = await DamageReport.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusBreakdown = {};
    statusAggregation.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    // 4. Breakdown by Primary AI Damage Type
    const damageTypeAggregation = await DamageReport.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $ifNull: ['$aiAnalysis.primaryDamageType', 'Unclassified'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 5. Service Area Distribution
    const serviceAreaAggregation = await DamageReport.aggregate([
      {
        $group: {
          _id: '$location.serviceArea',
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 6. Maintenance Worker Fleet Utilization
    const workerQuery = { role: 'worker', active: true };
    if (req.serviceAreaFilter) {
      workerQuery.serviceArea = req.serviceAreaFilter;
    }
    const workers = await User.find(workerQuery);
    const totalWorkers = workers.length;
    let totalWorkerSlots = 0;
    let currentOccupiedSlots = 0;
    workers.forEach((w) => {
      const p = w.workerProfile || {};
      totalWorkerSlots += p.maxConcurrentJobs || 3;
      currentOccupiedSlots += p.currentActiveJobs || 0;
    });
    const utilizationRate = totalWorkerSlots > 0
      ? Math.round((currentOccupiedSlots / totalWorkerSlots) * 100)
      : 0;

    // 7. Average Resolution Time (in hours) for verified reports
    const verifiedAssignments = await Assignment.find({
      status: 'verified',
      completedAt: { $exists: true },
      assignedAt: { $exists: true }
    }).limit(100);

    let totalResolutionHours = 0;
    let verifiedCount = 0;
    verifiedAssignments.forEach((a) => {
      if (a.completedAt && a.assignedAt) {
        const diffMs = new Date(a.completedAt) - new Date(a.assignedAt);
        const hours = diffMs / (1000 * 60 * 60);
        if (hours > 0) {
          totalResolutionHours += hours;
          verifiedCount++;
        }
      }
    });
    const averageResolutionHours = verifiedCount > 0
      ? Math.round((totalResolutionHours / verifiedCount) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReports,
          verifiedReports,
          activeRepairs,
          pendingReview,
          unassignedCount,
          pendingVerification,
          totalWorkers,
          fleetUtilizationRate: utilizationRate,
          averageResolutionHours
        },
        severityBreakdown,
        statusBreakdown,
        damageTypeBreakdown: damageTypeAggregation.map((d) => ({ type: d._id, count: d.count })),
        serviceAreaBreakdown: serviceAreaAggregation.map((s) => ({
          serviceArea: s._id || 'Unknown District',
          total: s.total,
          critical: s.critical,
          verified: s.verified
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
