import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import { USER_STATUS_ENUM } from './config/status.constants.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const userSchema = new Schema({
    username:  { type: String, required: true, trim: true, minlength: 3 },
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

  // Plugins
  userSchema.plugin(cleanToJSON);
  userSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => userSchema.plugin(plugin));

  if (mongooseConnection.models.User) {
    return mongooseConnection.models.User;
  }
  return mongooseConnection.model('User', userSchema);
}; 