import mongoose from 'mongoose';

const songRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'played'],
    default: 'pending',
    index: true
  },
  creditsSpent: {
    type: Number,
    required: true,
    default: 1
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  playedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  priority: {
    type: Number,
    default: 0
  },
  metadata: {
    swipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SongSwipe'
    },
    requestSource: {
      type: String,
      enum: ['swipe', 'manual', 'system'],
      default: 'swipe'
    },
    location: {
      type: String
    },
    event: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Indexes for common queries
songRequestSchema.index({ status: 1, requestedAt: 1 });
songRequestSchema.index({ userId: 1, status: 1 });
songRequestSchema.index({ songId: 1, status: 1 });

// Virtual for request age
songRequestSchema.virtual('age').get(function() {
  return Date.now() - this.requestedAt;
});

// Methods
songRequestSchema.methods.approve = async function() {
  this.status = 'approved';
  return this.save();
};

songRequestSchema.methods.reject = async function(reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  return this.save();
};

songRequestSchema.methods.markAsPlayed = async function() {
  this.status = 'played';
  this.playedAt = new Date();
  return this.save();
};

// Statics
songRequestSchema.statics.getPendingRequests = function(limit = 50) {
  return this.find({ status: 'pending' })
    .sort({ priority: -1, requestedAt: 1 })
    .limit(limit)
    .populate('songId')
    .populate('userId', 'username');
};

songRequestSchema.statics.getUserRequests = function(userId, status) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ requestedAt: -1 })
    .populate('songId')
    .lean();
};

const SongRequest = mongoose.model('SongRequest', songRequestSchema);

export default SongRequest; 