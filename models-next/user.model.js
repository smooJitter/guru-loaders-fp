export default (context) => {
  const { mongooseConnection } = context;
  const bcrypt = require('bcryptjs');

  const userSchema = new mongooseConnection.Schema({
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  }, {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  });

  // Hash password before saving
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      return next();
    }
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Compare password method
  userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw error;
    }
  };

  // Update lastLogin
  userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return await this.save();
  };

  // Static methods
  userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
  };

  userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username });
  };

  // Create indexes
  userSchema.index({ email: 1 }, { unique: true });
  userSchema.index({ username: 1 }, { unique: true });
  userSchema.index({ role: 1 });
  userSchema.index({ createdAt: -1 });

  // Prevent duplicate model registration
  if (mongooseConnection.models.User) {
    return mongooseConnection.models.User;
  }

  return mongooseConnection.model('User', userSchema);
}; 