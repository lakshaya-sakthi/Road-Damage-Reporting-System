import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with search, filtering, and pagination (Admin only)
router.get('/', protect, authorize('admin', 'auditor'), async (req, res, next) => {
  try {
    const { role, serviceArea, active, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (serviceArea) query.serviceArea = serviceArea;
    if (active !== undefined) query.active = active === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
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

// @route   GET /api/users/workers
// @desc    Get worker roster with active jobs, skills, equipment, and location (Admin, Supervisor)
router.get('/workers', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { serviceArea, status } = req.query;
    const query = { role: 'worker', active: true };

    if (serviceArea) {
      query.serviceArea = serviceArea;
    } else if (req.user.role === 'supervisor') {
      query.serviceArea = req.user.serviceArea;
    }

    if (status) {
      query['workerProfile.availabilityStatus'] = status;
    }

    const workers = await User.find(query).sort({ 'workerProfile.currentActiveJobs': 1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users
// @desc    Create new user with explicit role (Admin only)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role, serviceArea, department, phone, workerProfile } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'field_inspector',
      serviceArea: serviceArea || 'Central District',
      department: department || 'Infrastructure Maintenance',
      phone,
      workerProfile: workerProfile || {}
    });

    await logAudit({
      action: 'ADMIN_USER_CREATED',
      entityType: 'User',
      entityId: user._id,
      user: req.user,
      details: { role: user.role, email: user.email },
      req
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get single user details
router.get('/:id', protect, authorize('admin', 'supervisor', 'auditor'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile, role, service area, or active status (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, role, serviceArea, department, phone, active, workerProfile } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (serviceArea) user.serviceArea = serviceArea;
    if (department) user.department = department;
    if (phone) user.phone = phone;
    if (active !== undefined) user.active = active;
    if (workerProfile) {
      user.workerProfile = { ...user.workerProfile.toObject(), ...workerProfile };
    }

    await user.save();

    await logAudit({
      action: 'ADMIN_USER_UPDATED',
      entityType: 'User',
      entityId: user._id,
      user: req.user,
      details: { role: user.role, active: user.active },
      req
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
