import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';
import { USER_STATUS_ENUM } from '../../config/status.constants.js';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  tenantId:  { type: String, required: true },
  status:    { type: String, enum: USER_STATUS_ENUM, default: 'active' },
  lastLogin: { type: Date },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Hooks
userSchema.pre('save', function () {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
});

// toJSON cleanup
userSchema.plugin(cleanToJSON);
userSchema.plugin(timestampsPlugin);

export default model('User', userSchema); 