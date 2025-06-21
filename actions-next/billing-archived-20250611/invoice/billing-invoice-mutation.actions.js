// billing-invoice-mutation.actions.js
// Placeholder for billing invoice mutation actions (to be migrated)

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INVOICE: (msg) => `Invalid invoice: ${msg}`,
  INVOICE_NOT_FOUND: 'Invoice not found',
  INVALID_INPUT: 'Invalid input',
};

const sanitizeInvoice = (invoice) => {
  if (!invoice) return invoice;
  const { __v, ...rest } = invoice;
  return rest;
};

const validateInvoice = (data) => {
  if (!data || typeof data !== 'object' || !data.userId || !data.stripeInvoiceId || typeof data.amountDue !== 'number') {
    return { isLeft: true, error: ERRORS.INVALID_INVOICE('Missing required fields') };
  }
  return { isLeft: false };
};

const validateInvoiceUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    return { isLeft: true, error: ERRORS.INVALID_INVOICE('Invalid update data') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const createInvoice = async ({ context, ...data }) => {
  const { Invoice } = context.models;
  const validated = validateInvoice(data);
  if (validated.isLeft) throw new Error(validated.error);
  const invoice = await new Invoice({ ...data, status: 'open' }).save();
  return sanitizeInvoice(invoice.toObject());
};

const updateInvoice = async ({ context, id, data }) => {
  const { Invoice } = context.models;
  const validated = validateInvoiceUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

const markInvoiceAsPaid = async ({ context, id, paymentData }) => {
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'paid', paidAt: new Date(), paymentData } },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

const markInvoiceAsOverdue = async ({ context, id }) => {
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'overdue', overdueAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

const cancelInvoice = async ({ context, id, reason }) => {
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } },
    { new: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

const voidInvoice = async ({ context, id, reason }) => {
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'void', voidedAt: new Date(), voidReason: reason } },
    { new: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

const bulkUpdateInvoices = async ({ context, ids, data }) => {
  const { Invoice } = context.models;
  const validated = validateInvoiceUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const result = await Invoice.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

const bulkMarkAsPaid = async ({ context, ids, paymentData }) => {
  const { Invoice } = context.models;
  const result = await Invoice.updateMany(
    { _id: { $in: ids } },
    { $set: { status: 'paid', paidAt: new Date(), paymentData } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingInvoice', {
  createInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  markInvoiceAsOverdue,
  cancelInvoice,
  voidInvoice,
  bulkUpdateInvoices,
  bulkMarkAsPaid
});
