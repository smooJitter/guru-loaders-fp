// billing-customer-bulk.actions.js
// Placeholder for billing customer bulk actions (to be migrated)

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_CUSTOMER: (msg) => `Invalid customer: ${msg}`,
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INVALID_INPUT: 'Invalid input',
};

const sanitizeCustomer = (customer) => {
  if (!customer) return customer;
  const { __v, ...rest } = customer;
  return rest;
};

const validateCustomerUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    return { isLeft: true, error: ERRORS.INVALID_CUSTOMER('Invalid update data') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const bulkUpdateCustomers = async ({ context, ids, data }) => {
  const { Customer } = context.models;
  const validated = validateCustomerUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const result = await Customer.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

const bulkDeleteCustomers = async ({ context, ids }) => {
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

const bulkRestoreCustomers = async ({ context, ids }) => {
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

export default withNamespace('billingCustomer', {
  bulkUpdateCustomers,
  bulkDeleteCustomers,
  bulkRestoreCustomers
});
