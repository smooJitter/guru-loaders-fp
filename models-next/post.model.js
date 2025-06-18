import { Schema } from 'mongoose';

export default (context) => {
  const { mongooseConnection } = context;

  const postSchema = new mongooseConnection.Schema({
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200
    },
    content: {
      type: String,
      required: true
    },
    author: {
      // ObjectId of User (not 'authorId')
      type: mongooseConnection.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    metadata: {
      type: Map,
      of: mongooseConnection.Schema.Types.Mixed,
      default: new Map()
    },
    publishedAt: {
      type: Date,
      index: true,
      sparse: true
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    likesArray: [{
      type: mongooseConnection.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }]
  }, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  });

  // Indexes
  postSchema.index({ title: 'text', content: 'text' });
  postSchema.index({ tags: 1 });
  postSchema.index({ createdAt: -1 });

  // Virtual for excerpt
  postSchema.virtual('excerpt').get(function() {
    return this.content.length > 200 
      ? `${this.content.substring(0, 200)}...`
      : this.content;
  });

  // Prevent duplicate model registration
  if (mongooseConnection.models.Post) {
    return mongooseConnection.models.Post;
  }

  return mongooseConnection.model('Post', postSchema);
}; 