import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DamageReport',
      required: true,
      index: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedByType: {
      type: String,
      enum: ['system_auto_allocator', 'supervisor_override', 'manual_dispatch'],
      default: 'system_auto_allocator'
    },
    scoreBreakdown: {
      proximityScore: { type: Number, default: 0 },
      capacityScore: { type: Number, default: 0 },
      skillScore: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: [
        'assigned',
        'accepted',
        'rejected',
        'in_progress',
        'completed',
        'verified',
        'reopened',
        'cancelled'
      ],
      default: 'assigned',
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    targetCompletionDate: {
      type: Date,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    verifiedAt: {
      type: Date
    },
    reopenedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

AssignmentSchema.index({ reportId: 1, status: 1 });
AssignmentSchema.index({ workerId: 1, status: 1 });

const Assignment = mongoose.model('Assignment', AssignmentSchema);
export default Assignment;
