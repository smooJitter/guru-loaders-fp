/**
 * Notification Schema
 * @module domain-models/lib/shared_schema/interaction/notification
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const NotificationActionSchema = new Schema({
  type: {
    type: String,
    enum: ['link', 'button', 'dismiss'],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  url: String,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, { _id: false });

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'system',
      'alert',
      'info',
      'success',
      'warning',
      'error',
      'social',
      'promotional'
    ],
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    enum: [1, 2, 3, 4, 5],  // 1 = highest, 5 = lowest
    default: 3
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'deleted'],
    default: 'unread'
  },
  icon: String,
  image: String,
  actions: [NotificationActionSchema],
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  expiresAt: Date,
  readAt: Date,
  archivedAt: Date,
  deletedAt: Date,
  deliveryStatus: {
    email: {
      sent: Boolean,
      sentAt: Date,
      error: String
    },
    push: {
      sent: Boolean,
      sentAt: Date,
      error: String
    },
    sms: {
      sent: Boolean,
      sentAt: Date,
      error: String
    }
  }
}, {
  timestamps: true
});

// Indexes
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, category: 1, status: 1 });
NotificationSchema.index({ entityType: 1, entityId: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtuals
NotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

NotificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Methods
NotificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
};

NotificationSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
};

NotificationSchema.methods.delete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
};

NotificationSchema.methods.addAction = function(action) {
  if (!action.type || !action.label) {
    throw new Error('Action must have type and label');
  }
  
  this.actions.push(action);
};

NotificationSchema.methods.updateDeliveryStatus = function(channel, success, error = null) {
  if (!this.deliveryStatus[channel]) {
    this.deliveryStatus[channel] = {};
  }
  
  this.deliveryStatus[channel].sent = success;
  this.deliveryStatus[channel].sentAt = new Date();
  if (error) {
    this.deliveryStatus[channel].error = error;
  }
};

// Statics
NotificationSchema.statics.findUnreadByUser = function(userId) {
  return this.find({
    userId,
    status: 'unread',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ priority: 1, createdAt: -1 });
};

NotificationSchema.statics.markAllAsRead = function(userId, category = null) {
  const query = {
    userId,
    status: 'unread'
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.updateMany(query, {
    $set: {
      status: 'read',
      readAt: new Date()
    }
  });
};

export { NotificationSchema, NotificationActionSchema }; 