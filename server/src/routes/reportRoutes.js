import express from 'express';
import DamageReport from '../models/DamageReport.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { authorize, enforceServiceArea } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import { callAIInference } from '../services/aiService.js';
import { allocateWorkerToReport } from '../services/allocationService.js';
import { logAudit } from '../services/auditService.js';
import { notifySupervisors } from '../services/notificationService.js';

const router = express.Router();

// Helper to generate sequential/unique report numbers (e.g., RDR-2026-0042)
const generateReportNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await DamageReport.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  return `RDR-${currentYear}-${seq}`;
};

// @route   POST /api/reports
// @desc    Upload road damage image, invoke real AI analysis, and initiate maintenance pipeline
// @access  Admin, Supervisor, Field Inspector
router.post(
  '/',
  protect,
  authorize('admin', 'supervisor', 'field_inspector'),
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Road damage photographic evidence is required. Please attach an image.'
        });
      }

      const {
        title,
        description,
        surfaceType = 'Asphalt',
        address = 'Unspecified Roadway',
        lat,
        lng,
        serviceArea
      } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Precise GPS coordinates (latitude and longitude) are required.'
        });
      }

      const reportNumber = await generateReportNumber();
      const resolvedServiceArea = serviceArea || req.user.serviceArea || 'Central District';

      // Execute real AI inference via FastAPI microservice
      const aiResponse = await callAIInference(req.file.path, req.file.originalname);
      const aiData = aiResponse.data;

      // Severity levels: Low, Medium, High, Critical
      const calculatedSeverity = aiData.calculated_severity || 'Medium';
      const reviewRequired = Boolean(aiData.review_required);

      // Status determination:
      // If AI flagged review required (low confidence or weights missing), status MUST be 'review_required'
      // Otherwise, status proceeds to 'pending_assignment'
      const initialStatus = reviewRequired ? 'review_required' : 'pending_assignment';

      const report = new DamageReport({
        reportNumber,
        title: title || `${aiData.primary_damage_type || 'Road Damage'} on ${address}`,
        description: description || 'Visual inspection report logged via mobile/web platform.',
        imageUrl: `/uploads/${req.file.filename}`,
        imageMetadata: {
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          sizeBytes: req.file.size,
          storageDriver: 'local'
        },
        surfaceType,
        location: {
          address,
          coordinates: {
            lat: Number(lat),
            lng: Number(lng)
          },
          serviceArea: resolvedServiceArea
        },
        reportedBy: req.user._id,
        status: initialStatus,
        priority: calculatedSeverity,
        aiAnalysis: {
          analyzedAt: new Date(),
          modelVersion: 'YOLOv8-RDD',
          status: aiData.success ? 'success' : 'weights_unavailable',
          inferenceSource: aiData.inference_source || 'real_yolo_weights',
          detections: aiData.detections || [],
          primaryDamageType: aiData.primary_damage_type || 'Surface Anomaly',
          overallConfidence: aiData.overall_confidence || 0.0,
          calculatedSeverity: calculatedSeverity,
          reviewRequired: reviewRequired,
          reviewReason: aiData.review_reason,
          technicalDisclaimer: aiData.technical_disclaimer
        },
        statusHistory: [
          {
            status: initialStatus,
            changedBy: req.user._id,
            changedByName: req.user.name,
            note: reviewRequired
              ? `Report ingested. AI flagged confidence ${Math.round((aiData.overall_confidence || 0) * 100)}% requiring supervisor review.`
              : 'Report ingested and AI analysis completed. Ready for automated maintenance dispatch.',
            timestamp: new Date()
          }
        ]
      });

      await report.save();

      await logAudit({
        action: 'REPORT_CREATED',
        entityType: 'Report',
        entityId: report._id,
        user: req.user,
        details: {
          reportNumber: report.reportNumber,
          initialStatus,
          severity: calculatedSeverity,
          reviewRequired
        },
        req
      });

      // If review required, notify supervisors in the service area
      if (reviewRequired) {
        await notifySupervisors(
          resolvedServiceArea,
          `Review Required: ${report.reportNumber}`,
          `New road damage report ${report.reportNumber} has a low AI confidence score (${Math.round((aiData.overall_confidence || 0) * 100)}%) or unconfirmed parameters. Verification required before dispatch.`,
          report._id
        );
      } else {
        // Automatically trigger worker allocation engine
        try {
          await allocateWorkerToReport(report._id, null);
        } catch (allocError) {
          console.error('[Auto-Alloc Ingest Error]:', allocError.message);
        }
      }

      const populatedReport = await DamageReport.findById(report._id)
        .populate('reportedBy', 'name email role department')
        .populate({
          path: 'currentAssignment',
          populate: { path: 'workerId', select: 'name email phone workerProfile' }
        });

      res.status(201).json({
        success: true,
        message: 'Road damage report submitted and processed successfully.',
        data: populatedReport
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/reports
// @desc    List all damage reports with filters, search, and pagination
router.get('/', protect, enforceServiceArea, async (req, res, next) => {
  try {
    const {
      status,
      priority,
      serviceArea,
      surfaceType,
      search,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    // Apply role-based territory scoping
    if (req.serviceAreaFilter) {
      query['location.serviceArea'] = req.serviceAreaFilter;
    } else if (serviceArea) {
      query['location.serviceArea'] = serviceArea;
    }

    // Field Inspectors viewing their own reports
    if (req.user.role === 'field_inspector' && req.query.myReports === 'true') {
      query.reportedBy = req.user._id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (surfaceType) query.surfaceType = surfaceType;

    if (search) {
      query.$or = [
        { reportNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'aiAnalysis.primaryDamageType': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);
    const reports = await DamageReport.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('reportedBy', 'name email role')
      .populate({
        path: 'currentAssignment',
        populate: { path: 'workerId', select: 'name email phone' }
      });

    const total = await DamageReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
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

// @route   GET /api/reports/:id
// @desc    Get detailed report by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const report = await DamageReport.findById(req.params.id)
      .populate('reportedBy', 'name email role department')
      .populate({
        path: 'currentAssignment',
        populate: { path: 'workerId', select: 'name email phone workerProfile' }
      })
      .populate('aiAnalysis.reviewedBy', 'name email role');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Damage report not found.' });
    }

    // Supervisors can only view reports in their service area
    if (
      req.user.role === 'supervisor' &&
      report.location?.serviceArea !== req.user.serviceArea
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. This report belongs to a different service area.'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reports/:id/review
// @desc    Supervisor review of low-confidence or unconfirmed AI analysis
// @access  Supervisor, Admin
router.post(
  '/:id/review',
  protect,
  authorize('supervisor', 'admin'),
  async (req, res, next) => {
    try {
      const { confirmedSeverity, confirmedDamageType, reviewNotes, action } = req.body;
      const report = await DamageReport.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      // Check service area for supervisor
      if (
        req.user.role === 'supervisor' &&
        report.location?.serviceArea !== req.user.serviceArea
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not authorized to review reports outside your district.'
        });
      }

      const prevSeverity = report.priority;
      const newSeverity = confirmedSeverity || report.priority;

      report.priority = newSeverity;
      report.aiAnalysis.calculatedSeverity = newSeverity;
      if (confirmedDamageType) {
        report.aiAnalysis.primaryDamageType = confirmedDamageType;
      }
      report.aiAnalysis.reviewRequired = false;
      report.aiAnalysis.reviewedBy = req.user._id;
      report.aiAnalysis.reviewedAt = new Date();
      report.aiAnalysis.reviewNotes = reviewNotes || 'Human inspection verified and approved.';

      if (action === 'reject') {
        report.status = 'rejected';
        report.statusHistory.push({
          status: 'rejected',
          changedBy: req.user._id,
          changedByName: req.user.name,
          note: `Report rejected by supervisor: ${reviewNotes || 'Does not qualify as actionable road hazard.'}`,
          timestamp: new Date()
        });
        await report.save();

        await logAudit({
          action: 'REPORT_REVIEW_REJECTED',
          entityType: 'Report',
          entityId: report._id,
          user: req.user,
          details: { reviewNotes },
          req
        });

        return res.status(200).json({
          success: true,
          message: 'Report has been rejected and closed.',
          data: report
        });
      }

      // Approve for maintenance dispatch
      report.status = 'pending_assignment';
      report.statusHistory.push({
        status: 'pending_assignment',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Supervisor verified AI parameters (Severity: ${newSeverity}, Type: ${report.aiAnalysis.primaryDamageType}). Queued for automated allocation.`,
        timestamp: new Date()
      });

      await report.save();

      await logAudit({
        action: 'REPORT_REVIEW_APPROVED',
        entityType: 'Report',
        entityId: report._id,
        user: req.user,
        details: { prevSeverity, newSeverity, reviewNotes },
        req
      });

      // Automatically allocate worker
      const allocResult = await allocateWorkerToReport(report._id, req.user);

      const updatedReport = await DamageReport.findById(report._id)
        .populate('reportedBy', 'name email role')
        .populate({
          path: 'currentAssignment',
          populate: { path: 'workerId', select: 'name email phone' }
        });

      res.status(200).json({
        success: true,
        message: 'Report reviewed, verified, and dispatched to maintenance worker.',
        allocationResult: allocResult,
        data: updatedReport
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/reports/:id/auto-assign
// @desc    Manually trigger automatic worker allocation algorithm
router.post(
  '/:id/auto-assign',
  protect,
  authorize('supervisor', 'admin'),
  async (req, res, next) => {
    try {
      const result = await allocateWorkerToReport(req.params.id, req.user);
      const report = await DamageReport.findById(req.params.id)
        .populate('reportedBy', 'name email role')
        .populate({
          path: 'currentAssignment',
          populate: { path: 'workerId', select: 'name email phone workerProfile' }
        });

      res.status(200).json({
        success: result.success,
        message: result.message || 'Worker auto-allocation completed.',
        allocation: result,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/reports/:id/manual-assign
// @desc    Supervisor or Admin manually assigns report to specific worker
router.post(
  '/:id/manual-assign',
  protect,
  authorize('supervisor', 'admin'),
  async (req, res, next) => {
    try {
      const { workerId, notes } = req.body;
      const report = await DamageReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      const worker = await User.findOne({ _id: workerId, role: 'worker', active: true });
      if (!worker) {
        return res.status(404).json({ success: false, message: 'Eligible worker not found.' });
      }

      const Assignment = (await import('../models/Assignment.js')).default;
      const { getTargetCompletionDate } = await import('../services/allocationService.js');

      const targetDate = getTargetCompletionDate(report.priority);

      const assignment = await Assignment.create({
        reportId: report._id,
        workerId: worker._id,
        assignedBy: req.user._id,
        assignedByType: 'supervisor_override',
        status: 'assigned',
        targetCompletionDate: targetDate,
        assignedAt: new Date()
      });

      report.status = 'assigned';
      report.currentAssignment = assignment._id;
      report.statusHistory.push({
        status: 'assigned',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `Manually dispatched to ${worker.name} by ${req.user.name}. ${notes || ''}`,
        timestamp: new Date()
      });
      await report.save();

      await User.findByIdAndUpdate(worker._id, {
        $inc: { 'workerProfile.currentActiveJobs': 1 }
      });

      const { createNotification } = await import('../services/notificationService.js');
      await createNotification({
        recipientId: worker._id,
        title: `Direct Assignment: ${report.reportNumber}`,
        message: `Supervisor ${req.user.name} assigned you to ${report.location.address}. Priority: ${report.priority}.`,
        type: 'assignment',
        relatedReportId: report._id
      });

      await logAudit({
        action: 'MANUAL_DISPATCH_ASSIGNMENT',
        entityType: 'Assignment',
        entityId: assignment._id,
        user: req.user,
        details: { reportNumber: report.reportNumber, workerName: worker.name },
        req
      });

      res.status(200).json({
        success: true,
        message: `Report successfully assigned to ${worker.name}.`,
        assignment
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/reports/:id/reanalyze
// @desc    Re-run AI inference on the existing stored photo
router.post(
  '/:id/reanalyze',
  protect,
  authorize('admin', 'supervisor'),
  async (req, res, next) => {
    try {
      const report = await DamageReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }

      const relativePath = report.imageUrl.replace(/^\//, '');
      const aiResponse = await callAIInference(relativePath, 'reanalyze.jpg');
      const aiData = aiResponse.data;

      report.aiAnalysis = {
        analyzedAt: new Date(),
        modelVersion: 'YOLOv8-RDD',
        status: aiData.success ? 'success' : 'weights_unavailable',
        inferenceSource: aiData.inference_source,
        detections: aiData.detections || [],
        primaryDamageType: aiData.primary_damage_type || report.aiAnalysis.primaryDamageType,
        overallConfidence: aiData.overall_confidence || 0.0,
        calculatedSeverity: aiData.calculated_severity || report.priority,
        reviewRequired: Boolean(aiData.review_required),
        reviewReason: aiData.review_reason,
        technicalDisclaimer: aiData.technical_disclaimer
      };

      report.statusHistory.push({
        status: report.status,
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: `AI reanalysis executed by ${req.user.name}. Confidence: ${Math.round((aiData.overall_confidence || 0) * 100)}%.`,
        timestamp: new Date()
      });

      await report.save();

      res.status(200).json({
        success: true,
        message: 'AI reanalysis completed.',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
