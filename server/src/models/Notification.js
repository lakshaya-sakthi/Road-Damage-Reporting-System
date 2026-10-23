import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'assignment',
        'review_required',
        'repair_completed',
        'repair_verified',
        'repair_reopened',
        'overdue_alert',
        'unassigned_alert',
        'system'
      ],
      default: 'system'
    },
    relatedReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DamageReport'
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
