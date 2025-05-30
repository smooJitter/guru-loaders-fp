import CreditAccount from '../models/CreditAccount.js';

/**
 * Remove sensitive fields from a credit account object
 * @param {Object} account
 * @returns {Object}
 */
const sanitizeCreditAccount = (account) => {
  if (!account) return account;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeAccount } = account;
  return safeAccount;
};

/**
 * Create a new credit account
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized credit account
 */
export const createCreditAccount = async ({ userId }) => {
  const account = await new CreditAccount({ userId }).save();
  return sanitizeCreditAccount(account.toObject());
};

/**
 * Get credit account by userId
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized credit account
 */
export const getCreditAccountByUserId = async ({ userId }) => {
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return sanitizeCreditAccount(account);
};

/**
 * Adjust credit account balance
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.amount
 * @returns {Promise<Object>} // sanitized credit account
 */
export const adjustBalance = async ({ userId, amount }) => {
  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { 
      $inc: { balance: amount },
      updatedAt: new Date()
    },
    { new: true }
  ).lean().exec();
  return sanitizeCreditAccount(account);
}; 