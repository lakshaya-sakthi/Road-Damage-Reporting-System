import mongoose from 'mongoose';

const RepairEvidenceSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DamageReport',
      required: true,
      index: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    beforeImageUrl: {
      type: String,
      required: true
    },
    afterImageUrl: {
      type: String,
      required: [true, 'After-repair photo is required for completion']
    },
    repairNotes: {
      type: String,
      required: [true, 'Please provide detailed repair notes and actions taken'],
      maxlength: 2000
    },
    materialsUsed: {
      type: [String],
      default: ['Hot-mix asphalt patch', 'Tack coat emulsified asphalt']
    },
    laborHours: {
      type: Number,
      default: 2.0,
      min: 0.1
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    supervisorFeedback: {
      type: String,
      maxlength: 1000
    },
    verificationStatus: {
      type: String,
      enum: ['pending_review', 'verified', 'reopened_rejected'],
      default: 'pending_review'
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

RepairEvidenceSchema.index({ reportId: 1 });
RepairEvidenceSchema.index({ workerId: 1 });

const RepairEvidence = mongoose.model('RepairEvidence', RepairEvidenceSchema);
export default RepairEvidence;
