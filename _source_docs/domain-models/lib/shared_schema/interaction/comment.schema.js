/**
 * Comment Schema
 * @module domain-models/lib/shared_schema/interaction/comment
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReactionSchema = new Schema({
  type: {
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const CommentSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted', 'flagged'],
    default: 'active'
  },
  reactions: [ReactionSchema],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  flags: [{
    reason: String,
    userId: Schema.Types.ObjectId,
    createdAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
CommentSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: -1 });
CommentSchema.index({ status: 1 });

// Virtual for reply count
CommentSchema.virtual('replyCount').get(function() {
  return this.model('Comment').countDocuments({ parentId: this._id });
});

// Methods
CommentSchema.methods.edit = function(newContent) {
  if (this.content !== newContent) {
    this.editHistory.push({
      content: this.content,
      editedAt: new Date()
    });
    this.content = newContent;
  }
};

CommentSchema.methods.addReaction = function(type, userId) {
  const existingReaction = this.reactions.find(r => 
    r.userId.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.type = type;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({ type, userId });
  }
};

CommentSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => 
    r.userId.toString() !== userId.toString()
  );
};

CommentSchema.methods.flag = function(reason, userId) {
  this.flags.push({
    reason,
    userId,
    createdAt: new Date()
  });
  
  if (this.flags.length >= 3) {
    this.status = 'flagged';
  }
};

export { CommentSchema, ReactionSchema }; 