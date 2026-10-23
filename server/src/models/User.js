import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'supervisor', 'field_inspector', 'worker', 'auditor'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'field_inspector'
    },
    department: {
      type: String,
      default: 'Central District',
      trim: true
    },
    serviceArea: {
      type: String,
      default: 'Central District',
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    // Worker-specific operational attributes
    workerProfile: {
      skills: {
        type: [String],
        default: ['asphalt_patching', 'crack_sealing']
      },
      equipment: {
        type: [String],
        default: ['compactor', 'tar_kettle']
      },
      maxConcurrentJobs: {
        type: Number,
        default: 3
      },
      currentActiveJobs: {
        type: Number,
        default: 0
      },
      availabilityStatus: {
        type: String,
        enum: ['available', 'on_duty', 'busy', 'off_duty', 'on_leave'],
        default: 'available'
      },
      currentCoordinates: {
        lat: { type: Number, default: 13.0827 },
        lng: { type: Number, default: 80.2707 },
        updatedAt: { type: Date, default: Date.now }
      }
    }
  },
  {
    timestamps: true
  }
);

// Pre-save password hashing hook
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform to JSON without password
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, active: 1 });
UserSchema.index({ serviceArea: 1 });

const User = mongoose.model('User', UserSchema);
export default User;
