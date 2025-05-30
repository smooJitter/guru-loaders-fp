import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';
import { VISIBILITY_ENUM } from '../../config/visibility.constants.js';

const { Schema, model } = mongoose;

const userProfileSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: String },
  name:      { type: String },
  avatarUrl: { type: String },
  bio:       { type: String },
  location:  { type: String },
  social: {
    linkedIn: { type: String },
    twitter:  { type: String },
    website:  { type: String }
  },
  visibility: {
    type: String,
    enum: VISIBILITY_ENUM,
    default: 'public'
  }
});

// Indexes
userProfileSchema.index({ userId: 1 }, { unique: true });
userProfileSchema.index({ name: 'text', bio: 'text', location: 'text' });

// toJSON + privacy
userProfileSchema.plugin(cleanToJSON);
userProfileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id; delete ret._id;
    if (ret.visibility === 'private') {
      delete ret.location;
      delete ret.social;
    }
    return ret;
  }
});

userProfileSchema.plugin(timestampsPlugin);

export default model('UserProfile', userProfileSchema); 