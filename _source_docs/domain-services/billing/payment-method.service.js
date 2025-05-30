import PaymentMethod from '../models/PaymentMethod.js';

/**
 * Remove sensitive fields from a payment method object
 * @param {Object} method
 * @returns {Object}
 */
const sanitizePaymentMethod = (method) => {
  if (!method) return method;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeMethod } = method;
  return safeMethod;
};

/**
 * Add a new payment method
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.stripePaymentMethodId
 * @returns {Promise<Object>} // sanitized payment method
 */
export const addPaymentMethod = async ({ userId, stripePaymentMethodId }) => {
  const method = await new PaymentMethod({
    userId,
    stripePaymentMethodId
  }).save();
  return sanitizePaymentMethod(method.toObject());
};

/**
 * Get all payment methods for a user
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object[]>} // array of sanitized payment methods
 */
export const getPaymentMethodsByUserId = async ({ userId }) => {
  const methods = await PaymentMethod.find({ userId }).lean().exec();
  return methods ? methods.map(sanitizePaymentMethod) : [];
};

/**
 * Get the default payment method for a user
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized payment method
 */
export const getDefaultPaymentMethod = async ({ userId }) => {
  const method = await PaymentMethod.findOne({ userId, isDefault: true }).lean().exec();
  return sanitizePaymentMethod(method);
};

/**
 * Set a payment method as default
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.stripePaymentMethodId
 * @returns {Promise<Object>} // sanitized payment method
 */
export const setDefaultPaymentMethod = async ({ userId, stripePaymentMethodId }) => {
  // First, unset any existing default
  await PaymentMethod.updateMany(
    { userId },
    { isDefault: false }
  ).exec();
  
  // Then set the new default
  const method = await PaymentMethod.findOneAndUpdate(
    { userId, stripePaymentMethodId },
    { isDefault: true },
    { new: true }
  ).lean().exec();
  return sanitizePaymentMethod(method);
}; 