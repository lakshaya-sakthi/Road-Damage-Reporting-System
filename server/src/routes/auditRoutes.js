import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// @route   GET /api/audit
// @desc    Retrieve system audit events (Admin and Auditor only)
router.get('/', protect, authorize('admin', 'auditor'), async (req, res, next) => {
  try {
    const {
      entityType,
      action,
      performedByName,
      startDate,
      endDate,
      page = 1,
      limit = 30
    } = req.query;

    const query = {};

    if (entityType) query.entityType = entityType;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (performedByName) query.performedByName = { $regex: performedByName, $options: 'i' };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('performedBy', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
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

export default router;
