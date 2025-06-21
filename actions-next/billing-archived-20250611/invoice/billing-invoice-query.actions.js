// billing-invoice-query.actions.js
// Placeholder for billing invoice query actions (to be migrated)

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

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const getInvoiceByStripeId = async ({ context, stripeInvoiceId }) => {
  const { Invoice } = context.models;
  const invoice = await Invoice.findOne({ stripeInvoiceId }).lean().exec();
  return invoice ? sanitizeInvoice(invoice) : null;
};

const getInvoicesByUser = async ({ context, userId }) => {
  const { Invoice } = context.models;
  const invoices = await Invoice.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return invoices.map(sanitizeInvoice);
};

const getInvoiceById = async ({ context, id }) => {
  const { Invoice } = context.models;
  const invoice = await Invoice.findById(id).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

const listOpenInvoices = async ({ context, limit = 10, offset = 0, sortBy = 'dueDate', sortOrder = 1 }) => {
  const { Invoice } = context.models;
  const query = Invoice.find({ status: 'open' })
    .sort({ [sortBy]: sortOrder })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();
  const [invoices, total] = await Promise.all([
    query,
    Invoice.countDocuments({ status: 'open' })
  ]);
  return {
    items: invoices.map(sanitizeInvoice),
    total,
    hasMore: total > offset + invoices.length
  };
};

const listPaidInvoices = async ({ context, limit = 10, offset = 0, sortBy = 'paidAt', sortOrder = -1, startDate, endDate }) => {
  const { Invoice } = context.models;
  const queryObj = {
    status: 'paid',
    ...(startDate && endDate ? {
      paidAt: {
        $gte: startDate,
        $lte: endDate
      }
    } : {})
  };
  const [invoices, total] = await Promise.all([
    Invoice.find(queryObj)
      .sort({ [sortBy]: sortOrder })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Invoice.countDocuments(queryObj)
  ]);
  return {
    items: invoices.map(sanitizeInvoice),
    total,
    hasMore: total > offset + invoices.length
  };
};

const listOverdueInvoices = async ({ context, limit = 10, offset = 0, sortBy = 'dueDate', sortOrder = 1 }) => {
  const { Invoice } = context.models;
  const queryObj = {
    status: 'open',
    dueDate: { $lt: new Date() }
  };
  const [invoices, total] = await Promise.all([
    Invoice.find(queryObj)
      .sort({ [sortBy]: sortOrder })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Invoice.countDocuments(queryObj)
  ]);
  return {
    items: invoices.map(sanitizeInvoice),
    total,
    hasMore: total > offset + invoices.length
  };
};

const searchInvoices = async ({ context, query, limit = 10, offset = 0, status, startDate, endDate }) => {
  const { Invoice } = context.models;
  const searchQuery = {
    $or: [
      { invoiceNumber: { $regex: query, $options: 'i' } },
      { 'customer.name': { $regex: query, $options: 'i' } },
      { 'customer.email': { $regex: query, $options: 'i' } }
    ],
    ...(status ? { status } : {}),
    ...(startDate && endDate ? {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    } : {})
  };
  const [invoices, total] = await Promise.all([
    Invoice.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Invoice.countDocuments(searchQuery)
  ]);
  return {
    items: invoices.map(sanitizeInvoice),
    total,
    hasMore: total > offset + invoices.length
  };
};

export default withNamespace('billingInvoice', {
  getInvoiceByStripeId,
  getInvoicesByUser,
  getInvoiceById,
  listOpenInvoices,
  listPaidInvoices,
  listOverdueInvoices,
  searchInvoices
});
