import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, serviceArea: user.serviceArea },
    process.env.JWT_SECRET || 'super_secret_jwt_key_road_damage_system_2026_dev_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user account (public registrations create field inspectors)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, serviceArea, department, phone, workerProfile } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Public register defaults to field_inspector; only admin can create other roles
    const assignedRole = role && ['admin', 'supervisor', 'worker', 'auditor'].includes(role)
      ? role
      : 'field_inspector';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      serviceArea: serviceArea || 'Central District',
      department: department || 'Infrastructure Maintenance',
      phone,
      workerProfile: workerProfile || {}
    });

    const token = generateToken(user);

    await logAudit({
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      user,
      details: { role: user.role, email: user.email },
      req
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        serviceArea: user.serviceArea,
        department: user.department,
        workerProfile: user.workerProfile
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT token
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact system administration.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password mismatch.'
      });
    }

    const token = generateToken(user);

    await logAudit({
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      user,
      details: { role: user.role, email: user.email },
      req
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        serviceArea: user.serviceArea,
        department: user.department,
        phone: user.phone,
        workerProfile: user.workerProfile
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, phone, currentCoordinates, availabilityStatus } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    if (currentCoordinates && user.role === 'worker') {
      user.workerProfile.currentCoordinates = {
        lat: Number(currentCoordinates.lat),
        lng: Number(currentCoordinates.lng),
        updatedAt: new Date()
      };
    }

    if (availabilityStatus && user.role === 'worker') {
      user.workerProfile.availabilityStatus = availabilityStatus;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/password
// @desc    Update user password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
