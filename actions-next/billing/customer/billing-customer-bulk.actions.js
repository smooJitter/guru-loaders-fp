import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import { createCustomerSchema } from './validation.js';

/**
 * Bulk actions for billing/customer
 * @module billing/customer/billing-customer-bulk.actions
 * All actions are pure, composable, context-injected, and validated.
 */

const ERRORS = {
  INVALID_CUSTOMER: (msg) => `Invalid customer: ${msg}`,
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Bulk update customers
 * @param {object} input - { context, ids, data }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkUpdateCustomers = async (input) => {
  const { context, ids, data } = input;
  if (!Array.isArray(ids) || ids.length === 0 || typeof data !== 'object') throw new Error(ERRORS.INVALID_INPUT);
  const { Customer } = context.models;
  const result = await Customer.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

/**
 * Bulk soft-delete customers
 * @param {object} input - { context, ids }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkDeleteCustomers = async (input) => {
  const { context, ids } = input;
  if (!Array.isArray(ids) || ids.length === 0) throw new Error(ERRORS.INVALID_INPUT);
  const { Customer } = context.models;
  const result = await Customer.updateMany(
    { _id: { $in: ids } },
    { $set: { deletedAt: new Date(), status: 'DELETED' } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

/**
 * Bulk restore customers
 * @param {object} input - { context, ids }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkRestoreCustomers = async (input) => {
  const { context, ids } = input;
  if (!Array.isArray(ids) || ids.length === 0) throw new Error(ERRORS.INVALID_INPUT);
  const { Customer } = context.models;
  const result = await Customer.updateMany(
    { _id: { $in: ids } },
    { $set: { deletedAt: null, status: 'ACTIVE' } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingCustomer', [
  { name: 'bulkUpdateCustomers', method: bulkUpdateCustomers, meta: { audit: true } },
  { name: 'bulkDeleteCustomers', method: bulkDeleteCustomers, meta: { audit: true } },
  { name: 'bulkRestoreCustomers', method: bulkRestoreCustomers, meta: { audit: true } }
]); 