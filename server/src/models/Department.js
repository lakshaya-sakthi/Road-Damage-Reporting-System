import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide department name'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Please provide department code'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    centerCoordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    coverageRadiusKm: {
      type: Number,
      default: 25
    },
    supervisorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

DepartmentSchema.index({ code: 1 });
DepartmentSchema.index({ name: 1 });

const Department = mongoose.model('Department', DepartmentSchema);
export default Department;
