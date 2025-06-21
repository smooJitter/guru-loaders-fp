/**
 * @module billing/invoice/billing-invoice-mutation.actions
 * Mutation actions for billing invoices.
 * All actions are pure, composable, auditable, and validated.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  createInvoiceSchema,
  getInvoiceByIdSchema,
  bulkImportInvoicesSchema
} from './validation.js';

// Error messages for invoice mutations
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
 * Create a new invoice
 * @param {object} input - Input object containing context and invoice data
 * @returns {Promise<object>} The created invoice object
 */
const createInvoice = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(createInvoiceSchema, { context, ...data });
  const { Invoice } = context.models;
  const invoice = await new Invoice({ ...validated, status: 'open' }).save();
  return sanitizeInvoice(invoice.toObject());
};

/**
 * Update an invoice
 * @param {object} input - { context, id, data }
 * @returns {Promise<object>} The updated invoice object
 */
const updateInvoice = async (input) => {
  const { context, id, data } = input;
  // # Reason: Only allow updates with valid data
  if (!id || typeof data !== 'object') throw new Error(ERRORS.INVALID_INPUT);
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

/**
 * Mark an invoice as paid
 * @param {object} input - { context, id, paymentData }
 * @returns {Promise<object>} The updated invoice object
 */
const markInvoiceAsPaid = async (input) => {
  const { context, id, paymentData } = input;
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'paid', paidAt: new Date(), paymentData } },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

/**
 * Mark an invoice as overdue
 * @param {object} input - { context, id }
 * @returns {Promise<object>} The updated invoice object
 */
const markInvoiceAsOverdue = async (input) => {
  const { context, id } = input;
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'overdue', overdueAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

/**
 * Cancel an invoice
 * @param {object} input - { context, id, reason }
 * @returns {Promise<object>} The updated invoice object
 */
const cancelInvoice = async (input) => {
  const { context, id, reason } = input;
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } },
    { new: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

/**
 * Void an invoice
 * @param {object} input - { context, id, reason }
 * @returns {Promise<object>} The updated invoice object
 */
const voidInvoice = async (input) => {
  const { context, id, reason } = input;
  const { Invoice } = context.models;
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: { status: 'void', voidedAt: new Date(), voidReason: reason } },
    { new: true }
  ).lean().exec();
  if (!invoice) throw new Error(ERRORS.INVOICE_NOT_FOUND);
  return sanitizeInvoice(invoice);
};

/**
 * Bulk update invoices
 * @param {object} input - { context, ids, data }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkUpdateInvoices = async (input) => {
  const { context, ids, data } = input;
  if (!Array.isArray(ids) || ids.length === 0 || typeof data !== 'object') throw new Error(ERRORS.INVALID_INPUT);
  const { Invoice } = context.models;
  const result = await Invoice.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

/**
 * Bulk mark invoices as paid
 * @param {object} input - { context, ids, paymentData }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkMarkAsPaid = async (input) => {
  const { context, ids, paymentData } = input;
  if (!Array.isArray(ids) || ids.length === 0) throw new Error(ERRORS.INVALID_INPUT);
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

// Export as an array of action objects for composability
export default withNamespace('billingInvoice', [
  { name: 'createInvoice', method: createInvoice, meta: { audit: true } },
  { name: 'updateInvoice', method: updateInvoice, meta: { audit: true } },
  { name: 'markInvoiceAsPaid', method: markInvoiceAsPaid, meta: { audit: true } },
  { name: 'markInvoiceAsOverdue', method: markInvoiceAsOverdue, meta: { audit: true } },
  { name: 'cancelInvoice', method: cancelInvoice, meta: { audit: true } },
  { name: 'voidInvoice', method: voidInvoice, meta: { audit: true } },
  { name: 'bulkUpdateInvoices', method: bulkUpdateInvoices, meta: { audit: true } },
  { name: 'bulkMarkAsPaid', method: bulkMarkAsPaid, meta: { audit: true } }
]); 