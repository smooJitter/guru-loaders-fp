import Customer from '../models/Customer.js';

/**
 * Remove sensitive fields from a customer object
 * @param {Object} customer
 * @returns {Object}
 */
const sanitizeCustomer = (customer) => {
  if (!customer) return customer;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeCustomer } = customer;
  return safeCustomer;
};

/**
 * Create a new customer
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.stripeCustomerId
 * @returns {Promise<Object>} // sanitized customer
 */
export const createCustomer = async ({ userId, stripeCustomerId }) => {
  const customer = await new Customer({ userId, stripeCustomerId }).save();
  return sanitizeCustomer(customer.toObject());
};

/**
 * Get customer by userId
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized customer
 */
export const getCustomerByUserId = async ({ userId }) => {
  const customer = await Customer.findOne({ userId }).lean().exec();
  return sanitizeCustomer(customer);
};

/**
 * Get customer by Stripe ID
 * @param {Object} params
 * @param {string} params.stripeCustomerId
 * @returns {Promise<Object>} // sanitized customer
 */
export const getCustomerByStripeId = async ({ stripeCustomerId }) => {
  const customer = await Customer.findOne({ stripeCustomerId }).lean().exec();
  return sanitizeCustomer(customer);
}; 