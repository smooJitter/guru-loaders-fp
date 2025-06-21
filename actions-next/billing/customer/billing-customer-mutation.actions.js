import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import { 
  createCustomerSchema 
} from './validation.js';

/**
 * Mutation actions for billing/customer
 * @module billing/customer/billing-customer-mutation.actions
 * All actions are pure, composable, context-injected, and validated.
 */

const ERRORS = {
  INVALID_CUSTOMER: (msg) => `Invalid customer: ${msg}`,
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from customer object
 * @param {object} customer - The customer object
 * @returns {object} Sanitized customer object
 */
const sanitizeCustomer = (customer) => {
  if (!customer) return customer;
  const { __v, ...rest } = customer;
  return rest;
};

/**
 * Create a new customer
 * @param {object} input - Input object containing context and customer data
 * @returns {Promise<object>} The created customer object
 */
const createCustomer = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(createCustomerSchema, { context, ...data });
  const { Customer } = context.models;
  const customer = await new Customer(validated).save();
  return sanitizeCustomer(customer.toObject());
};

/**
 * Update a customer
 * @param {object} input - { context, id, data }
 * @returns {Promise<object>} The updated customer object
 */
const updateCustomer = async (input) => {
  const { context, id, data } = input;
  if (!id || typeof data !== 'object') throw new Error(ERRORS.INVALID_INPUT); // # Reason: Only allow updates with valid data
  const { Customer } = context.models;
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

/**
 * Soft-delete a customer
 * @param {object} input - { context, id }
 * @returns {Promise<object>} The deleted customer object
 */
const deleteCustomer = async (input) => {
  const { context, id } = input;
  const { Customer } = context.models;
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), status: 'DELETED' } },
    { new: true }
  ).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

/**
 * Restore a soft-deleted customer
 * @param {object} input - { context, id }
 * @returns {Promise<object>} The restored customer object
 */
const restoreCustomer = async (input) => {
  const { context, id } = input;
  const { Customer } = context.models;
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: { deletedAt: null, status: 'ACTIVE' } },
    { new: true }
  ).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

export default withNamespace('billingCustomer', [
  { name: 'createCustomer', method: createCustomer, meta: { audit: true } },
  { name: 'updateCustomer', method: updateCustomer, meta: { audit: true } },
  { name: 'deleteCustomer', method: deleteCustomer, meta: { audit: true } },
  { name: 'restoreCustomer', method: restoreCustomer, meta: { audit: true } }
]); 