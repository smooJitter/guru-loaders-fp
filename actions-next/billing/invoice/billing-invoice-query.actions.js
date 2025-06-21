/**
 * @module billing/invoice/billing-invoice-query.actions
 * Query actions for billing invoices.
 * All actions are pure, composable, auditable, and validated.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  getInvoiceByIdSchema
} from './validation.js';

const ERRORS = {
  INVALID_INVOICE: (msg) => `Invalid invoice: ${msg}`,
  INVOICE_NOT_FOUND: 'Invoice not found',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from invoice object
 * @param {object} invoice - The invoice object
 * @returns {object} Sanitized invoice object
 */
const sanitizeInvoice = (invoice) => {
  if (!invoice) return invoice;
  const { __v, ...rest } = invoice;
  return rest;
};

/**
 * Get invoice by Stripe ID
 * @param {object} input - { context, stripeInvoiceId }
 * @returns {Promise<object|null>} The invoice object or null
 */
const getInvoiceByStripeId = async (input) => {
  const { context, stripeInvoiceId } = input;
  const { Invoice } = context.models;
  const invoice = await Invoice.findOne({ stripeInvoiceId }).lean().exec();
  return invoice ? sanitizeInvoice(invoice) : null;
};

/**
 * Get invoices by user
 * @param {object} input - { context, userId }
 * @returns {Promise<Array>} Array of invoice objects
 */
const getInvoicesByUser = async (input) => {
  const { context, userId } = input;
  const { Invoice } = context.models;
  const invoices = await Invoice.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return invoices.map(sanitizeInvoice);
};

/**
 * Get invoice by ID
 * @param {object} input - { context, id }
 * @returns {Promise<object>} The invoice object
 */
const getInvoiceById = async (input) => {
  const { context, id } = input;
  await validate(getInvoiceByIdSchema, { context, invoiceId: id });
  const { Invoice } = context.models;
  const invoice = await Invoice.findById(id).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

/**
 * List open invoices
 * @param {object} input - { context, limit, offset, sortBy, sortOrder }
 * @returns {Promise<object>} Paginated result
 */
const listOpenInvoices = async (input) => {
  const { context, limit = 10, offset = 0, sortBy = 'dueDate', sortOrder = 1 } = input;
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

/**
 * List paid invoices
 * @param {object} input - { context, limit, offset, sortBy, sortOrder, startDate, endDate }
 * @returns {Promise<object>} Paginated result
 */
const listPaidInvoices = async (input) => {
  const { context, limit = 10, offset = 0, sortBy = 'paidAt', sortOrder = -1, startDate, endDate } = input;
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

/**
 * List overdue invoices
 * @param {object} input - { context, limit, offset, sortBy, sortOrder }
 * @returns {Promise<object>} Paginated result
 */
const listOverdueInvoices = async (input) => {
  const { context, limit = 10, offset = 0, sortBy = 'dueDate', sortOrder = 1 } = input;
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

/**
 * Search invoices
 * @param {object} input - { context, query, limit, offset, status, startDate, endDate }
 * @returns {Promise<object>} Paginated result
 */
const searchInvoices = async (input) => {
  const { context, query, limit = 10, offset = 0, status, startDate, endDate } = input;
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

// Export as an array of action objects for composability
export default withNamespace('billingInvoice', [
  { name: 'getInvoiceByStripeId', method: getInvoiceByStripeId, meta: { audit: true } },
  { name: 'getInvoicesByUser', method: getInvoicesByUser, meta: { audit: true } },
  { name: 'getInvoiceById', method: getInvoiceById, meta: { audit: true } },
  { name: 'listOpenInvoices', method: listOpenInvoices, meta: { audit: true } },
  { name: 'listPaidInvoices', method: listPaidInvoices, meta: { audit: true } },
  { name: 'listOverdueInvoices', method: listOverdueInvoices, meta: { audit: true } },
  { name: 'searchInvoices', method: searchInvoices, meta: { audit: true } }
]); 