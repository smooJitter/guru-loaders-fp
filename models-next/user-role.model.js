import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const roleSchema = new Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }]
  });

  roleSchema.plugin(cleanToJSON);
  roleSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => roleSchema.plugin(plugin));

  if (mongooseConnection.models.Role) {
    return mongooseConnection.models.Role;
  }
  return mongooseConnection.model('Role', roleSchema);
}; 