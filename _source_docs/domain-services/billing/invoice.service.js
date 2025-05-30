import Invoice from '../models/Invoice.js';

/**
 * Remove sensitive fields from an invoice object
 * @param {Object} invoice
 * @returns {Object}
 */
const sanitizeInvoice = (invoice) => {
  if (!invoice) return invoice;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeInvoice } = invoice;
  return safeInvoice;
};

/**
 * Create a new invoice
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.stripeInvoiceId
 * @param {number} params.amountDue
 * @param {Date} params.periodStart
 * @param {Date} params.periodEnd
 * @returns {Promise<Object>} // sanitized invoice
 */
export const createInvoice = async ({ userId, stripeInvoiceId, amountDue, periodStart, periodEnd }) => {
  const invoice = await new Invoice({
    userId,
    stripeInvoiceId,
    amountDue,
    periodStart,
    periodEnd,
    status: 'open'
  }).save();
  return sanitizeInvoice(invoice.toObject());
};

/**
 * Get invoice by Stripe ID
 * @param {Object} params
 * @param {string} params.stripeInvoiceId
 * @returns {Promise<Object>} // sanitized invoice
 */
export const getInvoiceByStripeId = async ({ stripeInvoiceId }) => {
  const invoice = await Invoice.findOne({ stripeInvoiceId }).lean().exec();
  return sanitizeInvoice(invoice);
};

/**
 * Get invoices by userId
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object[]>} // array of sanitized invoices
 */
export const getInvoicesByUserId = async ({ userId }) => {
  const invoices = await Invoice.find({ userId }).lean().exec();
  return invoices ? invoices.map(sanitizeInvoice) : [];
};

/**
 * Mark invoice as paid
 * @param {Object} params
 * @param {string} params.stripeInvoiceId
 * @returns {Promise<Object>} // sanitized invoice
 */
export const markInvoiceAsPaid = async ({ stripeInvoiceId }) => {
  const invoice = await Invoice.findOneAndUpdate(
    { stripeInvoiceId },
    { 
      status: 'paid',
      paidAt: new Date()
    },
    { new: true }
  ).lean().exec();
  return sanitizeInvoice(invoice);
};

/**
 * List open invoices
 * @returns {Promise<Object[]>} // array of sanitized invoices
 */
export const listOpenInvoices = async () => {
  const invoices = await Invoice.find({ status: 'open' }).lean().exec();
  return invoices ? invoices.map(sanitizeInvoice) : [];
}; 