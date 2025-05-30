import mongoose from 'mongoose';
import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import statusTrackableWithMetaPlugin from './lib/plugins/statusTrackableWithMeta.js';
import rbacPlugin from './lib/plugins/rbac.js';
import { ROLE_VALUES } from './config/roles.constants.js';
import { USER_ACCOUNT_STATUS_ENUM, USER_ACCOUNT_STATUS_META } from './config/status.constants.js';
import { THEME_ENUM } from './config/theme.constants.js';

const { Schema, model } = mongoose;

const userAccountSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User' },
  tenantId: { type: String, required: true },
  status: {
    type: String,
    enum: USER_ACCOUNT_STATUS_ENUM,
    default: 'active'
  },
  preferences: {
    receiveEmails: { type: Boolean, default: true },
    language:      { type: String,  default: 'en' },
    theme: {
      type: String,
      enum: THEME_ENUM,
      default: 'light'
    }
  },
  badges:     [{ type: String }],
  reputation: { type: Number, default: 0 }
});

// Indexes
userAccountSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

// toJSON
userAccountSchema.plugin(cleanToJSON);
userAccountSchema.plugin(timestampsPlugin);
userAccountSchema.plugin(statusTrackableWithMetaPlugin, {
  enum: USER_ACCOUNT_STATUS_ENUM,
  meta: USER_ACCOUNT_STATUS_META,
  trackHistory: true, // Or false if history is not needed
  userField: 'statusChangedBy', // Optional: customize the user field name
});

// Apply RBAC plugin - this will add the roles field as ObjectIds referencing the Role model
userAccountSchema.plugin(rbacPlugin, {
  roleRefPath: 'roles', // Explicitly state the field name, though it's the default
  populateRoles: true, // Automatically populate roles on find
  // defaultRole: 'USER', // Optional: set a default role ObjectId if needed
});

export default model('UserAccount', userAccountSchema); 