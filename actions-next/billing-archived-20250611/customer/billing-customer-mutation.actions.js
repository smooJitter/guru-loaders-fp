// billing-customer-mutation.actions.js
// Placeholder for billing customer mutation actions (to be migrated)

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

const validateCustomer = (data) => {
  if (!data || typeof data !== 'object' || !data.userId || !data.stripeCustomerId) {
    return { isLeft: true, error: ERRORS.INVALID_CUSTOMER('Missing required fields') };
  }
  return { isLeft: false };
};

const validateCustomerUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    return { isLeft: true, error: ERRORS.INVALID_CUSTOMER('Invalid update data') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const createCustomer = async ({ context, ...data }) => {
  const { Customer } = context.models;
  const validated = validateCustomer(data);
  if (validated.isLeft) throw new Error(validated.error);
  const customer = await new Customer(data).save();
  return sanitizeCustomer(customer.toObject());
};

const updateCustomer = async ({ context, id, data }) => {
  const { Customer } = context.models;
  const validated = validateCustomerUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

const deleteCustomer = async ({ context, id }) => {
  const { Customer } = context.models;
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), status: 'DELETED' } },
    { new: true }
  ).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

const restoreCustomer = async ({ context, id }) => {
  const { Customer } = context.models;
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: { deletedAt: null, status: 'ACTIVE' } },
    { new: true }
  ).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

export default withNamespace('billingCustomer', {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer
});
