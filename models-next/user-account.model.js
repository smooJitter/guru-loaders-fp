import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import statusTrackableWithMetaPlugin from './lib/plugins/statusTrackableWithMeta.js';
import rbacPlugin from './lib/plugins/rbac.js';
import { ROLE_VALUES } from './config/roles.constants.js';
import { USER_ACCOUNT_STATUS_ENUM, USER_ACCOUNT_STATUS_META } from './config/status.constants.js';
import { THEME_ENUM } from './config/theme.constants.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const userAccountSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accountType: { type: String, required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  });

  userAccountSchema.plugin(cleanToJSON);
  userAccountSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => userAccountSchema.plugin(plugin));

  if (mongooseConnection.models.UserAccount) {
    return mongooseConnection.models.UserAccount;
  }
  return mongooseConnection.model('UserAccount', userAccountSchema);
}; 