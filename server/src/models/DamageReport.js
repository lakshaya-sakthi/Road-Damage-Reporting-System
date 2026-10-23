import mongoose from 'mongoose';

const DetectionBoxSchema = new mongoose.Schema(
  {
    class_code: { type: String, default: 'D40' },
    class_name: { type: String, default: 'Pothole' },
    confidence: { type: Number, required: true },
    box: {
      xmin: Number,
      ymin: Number,
      xmax: Number,
      ymax: Number
    },
    required_skills: [String],
    required_equipment: [String]
  },
  { _id: false }
);

const AIAnalysisSchema = new mongoose.Schema(
  {
    analyzedAt: { type: Date, default: Date.now },
    modelVersion: { type: String, default: 'YOLOv8-RDD' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'weights_unavailable'],
      default: 'pending'
    },
    inferenceSource: { type: String, default: 'real_yolo_weights' },
    detections: [DetectionBoxSchema],
    primaryDamageType: { type: String, default: 'Pothole' },
    overallConfidence: { type: Number, default: 0.0 },
    calculatedSeverity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    reviewRequired: { type: Boolean, default: false },
    reviewReason: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    technicalDisclaimer: { type: String }
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: { type: String, default: 'System' },
    note: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const DamageReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the damage report'],
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    imageUrl: {
      type: String,
      required: [true, 'Road damage image is required']
    },
    imageMetadata: {
      originalName: String,
      mimetype: String,
      sizeBytes: Number,
      storageDriver: { type: String, default: 'local' }
    },
    surfaceType: {
      type: String,
      enum: ['Asphalt', 'Concrete', 'Composite', 'Gravel', 'Brick/Paver', 'Other'],
      default: 'Asphalt'
    },
    location: {
      address: { type: String, default: 'Unspecified Road Section' },
      coordinates: {
        lat: { type: Number, required: [true, 'Latitude is required'] },
        lng: { type: Number, required: [true, 'Longitude is required'] }
      },
      serviceArea: { type: String, default: 'Central District', trim: true }
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: [
        'detected',
        'pending_assignment',
        'assigned',
        'accepted',
        'in_progress',
        'completed',
        'verified',
        'review_required',
        'unassigned',
        'rejected',
        'overdue',
        'reopened'
      ],
      default: 'detected',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },
    aiAnalysis: {
      type: AIAnalysisSchema,
      default: () => ({})
    },
    currentAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    statusHistory: [StatusHistorySchema]
  },
  {
    timestamps: true
  }
);

DamageReportSchema.index({ 'location.coordinates': '2dsphere' });
DamageReportSchema.index({ status: 1, priority: 1 });
DamageReportSchema.index({ 'location.serviceArea': 1 });
DamageReportSchema.index({ createdAt: -1 });

const DamageReport = mongoose.model('DamageReport', DamageReportSchema);
export default DamageReport;
