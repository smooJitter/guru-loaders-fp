import CreditTransaction from '../models/CreditTransaction.js';

/**
 * Remove sensitive fields from a credit transaction object
 * @param {Object} txn
 * @returns {Object}
 */
const sanitizeCreditTransaction = (txn) => {
  if (!txn) return txn;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeTxn } = txn;
  return safeTxn;
};

/**
 * Create a new credit transaction
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.amount
 * @param {string} params.type
 * @param {string} [params.referenceId]
 * @param {string} [params.description]
 * @returns {Promise<Object>} // sanitized transaction
 */
export const createTransaction = async ({ userId, amount, type, referenceId, description }) => {
  const txn = await new CreditTransaction({
    userId,
    amount,
    type,
    referenceId,
    description
  }).save();
  return sanitizeCreditTransaction(txn.toObject());
};

/**
 * Get transactions by userId
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object[]>} // array of sanitized transactions
 */
export const getTransactionsByUserId = async ({ userId }) => {
  const txns = await CreditTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return txns ? txns.map(sanitizeCreditTransaction) : [];
};

/**
 * List transactions by type
 * @param {Object} params
 * @param {string} params.type
 * @returns {Promise<Object[]>} // array of sanitized transactions
 */
export const listTransactionsByType = async ({ type }) => {
  const txns = await CreditTransaction.find({ type })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return txns ? txns.map(sanitizeCreditTransaction) : [];
}; 