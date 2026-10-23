import express from 'express';
import Assignment from '../models/Assignment.js';
import DamageReport from '../models/DamageReport.js';
import RepairEvidence from '../models/RepairEvidence.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { authorize, enforceServiceArea } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { createNotification, notifySupervisors } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// @route   GET /api/assignments
// @desc    List all assignments (Admin, Supervisor, Auditor)
router.get('/', protect, authorize('admin', 'supervisor', 'auditor'), enforceServiceArea, async (req, res, next) => {
  try {
    const { status, workerId, serviceArea, page = 1, limit = 25 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (workerId) query.workerId = workerId;

    const skip = (Number(page) - 1) * Number(limit);

    const assignments = await Assignment.find(query)
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('workerId', 'name email phone serviceArea workerProfile')
      .populate({
        path: 'reportId',
        populate: { path: 'reportedBy', select: 'name email' }
      });

    const total = await Assignment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/assignments/my
// @desc    Get assignments allocated to current worker (Worker scope strictly enforced)
// @access  Maintenance Worker
router.get('/my', protect, authorize('worker'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { workerId: req.user._id };

    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .sort({ targetCompletionDate: 1, assignedAt: -1 })
      .populate('reportId');

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment details with report and evidence
router.get('/:id', protect, async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('workerId', 'name email phone serviceArea workerProfile')
      .populate({
        path: 'reportId',
        populate: { path: 'reportedBy', select: 'name email department' }
      });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Workers can only inspect their own assignment
    if (req.user.role === 'worker' && String(assignment.workerId._id) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to view another worker’s assignment.'
      });
    }

    const evidence = await RepairEvidence.findOne({ assignmentId: assignment._id })
      .populate('supervisorId', 'name email');

    res.status(200).json({
      success: true,
      data: assignment,
      evidence
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/assignments/:id/accept
// @desc    Worker accepts an assigned job
// @access  Maintenance Worker
router.post('/:id/accept', protect, authorize('worker'), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Strict ownership verification
    if (String(assignment.workerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only accept jobs assigned directly to you.'
      });
    }

    if (assignment.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept assignment in status '${assignment.status}'.`
      });
    }

    assignment.status = 'accepted';
    assignment.acceptedAt = new Date();
    await assignment.save();

    const report = await DamageReport.findById(assignment.reportId);
    if (report) {
      report.status = 'accepted';
      report.statusHistory.push({
        status: 'accepted',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Maintenance Worker ${req.user.name} accepted the job assignment.`,
        timestamp: new Date()
      });
      await report.save();
    }

    await logAudit({
      action: 'ASSIGNMENT_ACCEPTED',
      entityType: 'Assignment',
      entityId: assignment._id,
      user: req.user,
      details: { reportNumber: report?.reportNumber },
      req
    });

    res.status(200).json({
      success: true,
      message: 'Job assignment accepted successfully.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/assignments/:id/reject
// @desc    Worker rejects an assignment with mandatory reason
// @access  Maintenance Worker
router.post('/:id/reject', protect, authorize('worker'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A clear explanation/reason is mandatory when rejecting a job assignment.'
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Strict worker ownership verification
    if (String(assignment.workerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot reject assignments allocated to other workers.'
      });
    }

    if (assignment.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject an assignment in '${assignment.status}' state.`
      });
    }

    assignment.status = 'rejected';
    assignment.rejectionReason = reason;
    await assignment.save();

    // Decrement worker active jobs
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'workerProfile.currentActiveJobs': -1 },
      $set: { 'workerProfile.availabilityStatus': 'available' }
    });

    // Reopen report to Unassigned so it can be reallocated
    const report = await DamageReport.findById(assignment.reportId);
    if (report) {
      report.status = 'unassigned';
      report.currentAssignment = null;
      report.statusHistory.push({
        status: 'unassigned',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Assignment rejected by worker ${req.user.name}. Reason: ${reason}. Returned to unassigned pool.`,
        timestamp: new Date()
      });
      await report.save();

      // Notify supervisors of the rejection
      await notifySupervisors(
        report.location.serviceArea,
        `Assignment Rejected: ${report.reportNumber}`,
        `Worker ${req.user.name} rejected job on ${report.location.address}. Reason: "${reason}". Report returned to Unassigned queue.`,
        report._id
      );
    }

    await logAudit({
      action: 'ASSIGNMENT_REJECTED',
      entityType: 'Assignment',
      entityId: assignment._id,
      user: req.user,
      details: { reason, reportNumber: report?.reportNumber },
      req
    });

    res.status(200).json({
      success: true,
      message: 'Job rejected and returned to unassigned queue.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/assignments/:id/status
// @desc    Worker begins repair (transitions to 'in_progress')
// @access  Maintenance Worker
router.post('/:id/status', protect, authorize('worker'), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (String(assignment.workerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. Worker ownership violation.' });
    }

    if (status === 'in_progress') {
      assignment.status = 'in_progress';
      assignment.startedAt = new Date();
      await assignment.save();

      const report = await DamageReport.findById(assignment.reportId);
      if (report) {
        report.status = 'in_progress';
        report.statusHistory.push({
          status: 'in_progress',
          changedBy: req.user._id,
          changedByName: req.user.name,
          note: note || `Worker arrived on site at ${report.location.address} and initiated repair operations.`,
          timestamp: new Date()
        });
        await report.save();
      }

      await logAudit({
        action: 'REPAIR_STARTED',
        entityType: 'Assignment',
        entityId: assignment._id,
        user: req.user,
        details: { reportNumber: report?.reportNumber },
        req
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/assignments/:id/evidence
// @desc    Worker submits repair notes, materials used, and after-repair photo
// @access  Maintenance Worker
router.post(
  '/:id/evidence',
  protect,
  authorize('worker'),
  upload.single('afterImage'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'After-repair photographic evidence is required to mark work completed.'
        });
      }

      const { repairNotes, materialsUsed, laborHours } = req.body;
      if (!repairNotes || repairNotes.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Comprehensive repair notes (minimum 10 characters) are required.'
        });
      }

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      if (String(assignment.workerId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden. Worker ownership violation.' });
      }

      const report = await DamageReport.findById(assignment.reportId);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      const parsedMaterials = typeof materialsUsed === 'string'
        ? materialsUsed.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(materialsUsed) ? materialsUsed : ['Hot-mix asphalt patch'];

      const evidence = await RepairEvidence.create({
        assignmentId: assignment._id,
        reportId: report._id,
        workerId: req.user._id,
        beforeImageUrl: report.imageUrl,
        afterImageUrl: `/uploads/${req.file.filename}`,
        repairNotes: repairNotes.trim(),
        materialsUsed: parsedMaterials,
        laborHours: Number(laborHours) || 2.0,
        verificationStatus: 'pending_review'
      });

      assignment.status = 'completed';
      assignment.completedAt = new Date();
      await assignment.save();

      report.status = 'completed';
      report.statusHistory.push({
        status: 'completed',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Repairs concluded by ${req.user.name}. After-photo submitted for supervisor inspection.`,
        timestamp: new Date()
      });
      await report.save();

      // Decrement worker active jobs
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'workerProfile.currentActiveJobs': -1 },
        $set: { 'workerProfile.availabilityStatus': 'available' }
      });

      // Notify supervisors that job is ready for verification
      await notifySupervisors(
        report.location.serviceArea,
        `Ready for Verification: ${report.reportNumber}`,
        `Worker ${req.user.name} completed road repairs on ${report.location.address}. Please inspect before-and-after evidence.`,
        report._id
      );

      await logAudit({
        action: 'REPAIR_COMPLETED_EVIDENCE_SUBMITTED',
        entityType: 'Evidence',
        entityId: evidence._id,
        user: req.user,
        details: { reportNumber: report.reportNumber, laborHours },
        req
      });

      res.status(201).json({
        success: true,
        message: 'Repair evidence uploaded. Task moved to supervisor verification queue.',
        data: evidence
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/assignments/:id/verify
// @desc    Supervisor verifies or reopens completed repair
// @access  Supervisor, Admin
router.post('/:id/verify', protect, authorize('supervisor', 'admin'), async (req, res, next) => {
  try {
    const { action, feedback } = req.body; // action: 'approve' | 'reopen'
    if (!action || !['approve', 'reopen'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'reopen'."
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const report = await DamageReport.findById(assignment.reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check service area boundary
    if (
      req.user.role === 'supervisor' &&
      report.location?.serviceArea !== req.user.serviceArea
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only verify repairs within your assigned district.'
      });
    }

    const evidence = await RepairEvidence.findOne({ assignmentId: assignment._id });

    if (action === 'approve') {
      assignment.status = 'verified';
      assignment.verifiedAt = new Date();
      await assignment.save();

      report.status = 'verified';
      report.statusHistory.push({
        status: 'verified',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Supervisor ${req.user.name} inspected repair photos and approved closure. Feedback: ${feedback || 'Approved without caveat.'}`,
        timestamp: new Date()
      });
      await report.save();

      if (evidence) {
        evidence.verificationStatus = 'verified';
        evidence.supervisorId = req.user._id;
        evidence.supervisorFeedback = feedback || 'Quality standard satisfied.';
        evidence.verifiedAt = new Date();
        await evidence.save();
      }

      // Notify the worker of verification approval
      await createNotification({
        recipientId: assignment.workerId,
        title: `Repair Verified: ${report.reportNumber}`,
        message: `Supervisor ${req.user.name} approved your repair on ${report.location.address}. Excellent work!`,
        type: 'repair_verified',
        relatedReportId: report._id
      });

      await logAudit({
        action: 'REPAIR_VERIFIED',
        entityType: 'Report',
        entityId: report._id,
        user: req.user,
        details: { reportNumber: report.reportNumber, supervisor: req.user.name },
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Repair verified and closed successfully.',
        data: assignment
      });
    } else {
      // Reopen repair
      assignment.status = 'reopened';
      assignment.reopenedAt = new Date();
      await assignment.save();

      report.status = 'reopened';
      report.statusHistory.push({
        status: 'reopened',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Supervisor ${req.user.name} rejected completion and reopened ticket. Required correction: "${feedback || 'Repair quality insufficient.'}"`,
        timestamp: new Date()
      });
      await report.save();

      if (evidence) {
        evidence.verificationStatus = 'reopened_rejected';
        evidence.supervisorId = req.user._id;
        evidence.supervisorFeedback = feedback || 'Correction required.';
        await evidence.save();
      }

      // Increment worker's active job again
      await User.findByIdAndUpdate(assignment.workerId, {
        $inc: { 'workerProfile.currentActiveJobs': 1 },
        $set: { 'workerProfile.availabilityStatus': 'busy' }
      });

      // Notify the worker with supervisor instructions
      await createNotification({
        recipientId: assignment.workerId,
        title: `Action Required: Reopened Job ${report.reportNumber}`,
        message: `Supervisor ${req.user.name} reopened repair on ${report.location.address}. Feedback: "${feedback || 'Please redo surface finish'}".`,
        type: 'repair_reopened',
        relatedReportId: report._id
      });

      await logAudit({
        action: 'REPAIR_REOPENED',
        entityType: 'Report',
        entityId: report._id,
        user: req.user,
        details: { reportNumber: report.reportNumber, feedback },
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Repair ticket reopened and dispatched back to worker with feedback.',
        data: assignment
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
