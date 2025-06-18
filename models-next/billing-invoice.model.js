export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  // Import dependencies using require for compatibility if needed
  const cleanToJSON = require('../../lib/plugins/cleanToJSON.js');
  const timestampsPlugin = require('../../lib/plugins/timestamps.js');
  const { INVOICE_STATUS_ENUM } = require('../../config/status.constants.js');
  const { MetadataSchema } = require('../../domain-models/lib/shared_schema/core/metadata.schema.js');

  const { Schema } = mongooseConnection;

  // Define the schema
  const invoiceSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeInvoiceId: { type: String, required: true, unique: true, select: false },
    amountDue: { type: Number, required: true },
    status: { type: String, enum: INVOICE_STATUS_ENUM, default: 'open' },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    paidAt: { type: Date },
    invoiceId: { type: String, required: true, unique: true },
    metadata: { type: MetadataSchema }
  });

  // Indexes
  invoiceSchema.index({ userId: 1, status: 1 });

  // Plugins
  invoiceSchema.plugin(cleanToJSON);
  invoiceSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => invoiceSchema.plugin(plugin));

  // Prevent duplicate model registration
  if (mongooseConnection.models.Invoice) {
    return mongooseConnection.models.Invoice;
  }

  // Register and return the model using the provided mongoose connection
  return mongooseConnection.model('Invoice', invoiceSchema);
}; 