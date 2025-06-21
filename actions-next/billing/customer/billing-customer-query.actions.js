import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import { 
  getCustomerByIdSchema,
  getCustomerByStripeIdSchema,
  getCustomersByUserSchema,
  listActiveCustomersSchema,
  listDeletedCustomersSchema,
  searchCustomersSchema,
  getCustomerByEmailSchema,
  getCustomersByStatusSchema
} from './validation.js';

/**
 * Query actions for billing/customer
 * @module billing/customer/billing-customer-query.actions
 * All actions are pure, composable, context-injected, and validated.
 */

const ERRORS = {
  CUSTOMER_NOT_FOUND: 'Customer not found',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from customer object
 * @param {object} customer - The customer object
 * @returns {object} Sanitized customer object
 */
export const sanitizeCustomer = (customer) => {
  if (!customer) return customer;
  const { __v, ...rest } = customer;
  return rest;
};

/**
 * Get customer by ID
 * @param {object} input - { context, customerId }
 * @returns {Promise<object|null>} Customer object or null
 */
const getCustomerById = async (input) => {
  const { context, customerId } = input;
  await validate(getCustomerByIdSchema, { context, customerId });
  const { Customer } = context.models;
  const customer = await Customer.findById(customerId).lean().exec();
  if (!customer) throw new Error(ERRORS.CUSTOMER_NOT_FOUND);
  return sanitizeCustomer(customer);
};

/**
 * Get customer by Stripe ID
 * @param {object} input - { context, stripeCustomerId }
 * @returns {Promise<object|null>} Customer object or null
 */
const getCustomerByStripeId = async (input) => {
  const { context, stripeCustomerId } = input;
  await validate(getCustomerByStripeIdSchema, { context, stripeCustomerId });
  const { Customer } = context.models;
  const customer = await Customer.findOne({ stripeCustomerId }).lean().exec();
  return customer ? sanitizeCustomer(customer) : null;
};

/**
 * Get customers by user ID
 * @param {object} input - { context, userId }
 * @returns {Promise<object[]>} Array of customer objects
 */
const getCustomersByUser = async (input) => {
  const { context, userId } = input;
  await validate(getCustomersByUserSchema, { context, userId });
  const { Customer } = context.models;
  const customers = await Customer.find({ userId, deletedAt: null }).lean().exec();
  return customers.map(sanitizeCustomer);
};

/**
 * List all active customers (paginated)
 * @param {object} input - { context, limit, offset }
 * @returns {Promise<object>} Paginated result
 */
const listActiveCustomers = async (input) => {
  const { context, limit = 20, offset = 0 } = input;
  await validate(listActiveCustomersSchema, { context, limit, offset });
  const { Customer } = context.models;
  const [items, total] = await Promise.all([
    Customer.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Customer.countDocuments({ deletedAt: null })
  ]);
  return {
    items: items.map(sanitizeCustomer),
    total,
    hasMore: total > offset + items.length
  };
};

/**
 * List all deleted customers (paginated)
 * @param {object} input - { context, limit, offset }
 * @returns {Promise<object>} Paginated result
 */
const listDeletedCustomers = async (input) => {
  const { context, limit = 20, offset = 0 } = input;
  await validate(listDeletedCustomersSchema, { context, limit, offset });
  const { Customer } = context.models;
  const [items, total] = await Promise.all([
    Customer.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Customer.countDocuments({ deletedAt: { $ne: null } })
  ]);
  return {
    items: items.map(sanitizeCustomer),
    total,
    hasMore: total > offset + items.length
  };
};

/**
 * Search customers by query (name, email, etc.)
 * @param {object} input - { context, query, limit, offset, status }
 * @returns {Promise<object>} Paginated result
 */
const searchCustomers = async (input) => {
  const { context, query, limit = 20, offset = 0, status } = input;
  await validate(searchCustomersSchema, { context, query, limit, offset, status });
  const { Customer } = context.models;
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ],
    ...(status ? { status } : {})
  };
  const [items, total] = await Promise.all([
    Customer.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Customer.countDocuments(searchQuery)
  ]);
  return {
    items: items.map(sanitizeCustomer),
    total,
    hasMore: total > offset + items.length
  };
};

/**
 * Get customer by email
 * @param {object} input - { context, email }
 * @returns {Promise<object|null>} Customer object or null
 */
const getCustomerByEmail = async (input) => {
  const { context, email } = input;
  await validate(getCustomerByEmailSchema, { context, email });
  const { Customer } = context.models;
  const customer = await Customer.findOne({ email }).lean().exec();
  return customer ? sanitizeCustomer(customer) : null;
};

/**
 * Get customers by status (paginated)
 * @param {object} input - { context, status, limit, offset }
 * @returns {Promise<object>} Paginated result
 */
const getCustomersByStatus = async (input) => {
  const { context, status, limit = 20, offset = 0 } = input;
  await validate(getCustomersByStatusSchema, { context, status, limit, offset });
  const { Customer } = context.models;
  const [items, total] = await Promise.all([
    Customer.find({ status })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Customer.countDocuments({ status })
  ]);
  return {
    items: items.map(sanitizeCustomer),
    total,
    hasMore: total > offset + items.length
  };
};

export default withNamespace('billingCustomer', [
  { name: 'getCustomerById', method: getCustomerById, meta: { audit: true } },
  { name: 'getCustomerByStripeId', method: getCustomerByStripeId, meta: { audit: true } },
  { name: 'getCustomersByUser', method: getCustomersByUser, meta: { audit: true } },
  { name: 'listActiveCustomers', method: listActiveCustomers, meta: { audit: true } },
  { name: 'listDeletedCustomers', method: listDeletedCustomers, meta: { audit: true } },
  { name: 'searchCustomers', method: searchCustomers, meta: { audit: true } },
  { name: 'getCustomerByEmail', method: getCustomerByEmail, meta: { audit: true } },
  { name: 'getCustomersByStatus', method: getCustomersByStatus, meta: { audit: true } }
]); 