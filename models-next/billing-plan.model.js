import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const planSchema = new Schema({
    name: { type: String, required: true, unique: true },
    stripePriceId: { type: String, required: true, unique: true, select: false },
    isActive: { type: Boolean, default: true },
    description: { type: String }
  });

  planSchema.index({ name: 1 }, { unique: true });

  planSchema.plugin(cleanToJSON);
  planSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => planSchema.plugin(plugin));

  if (mongooseConnection.models.Plan) {
    return mongooseConnection.models.Plan;
  }
  return mongooseConnection.model('Plan', planSchema);
}; 