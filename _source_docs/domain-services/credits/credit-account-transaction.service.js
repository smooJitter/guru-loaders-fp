import CreditAccount from '../models/CreditAccount.js';
import CreditTransaction from '../models/CreditTransaction.js';

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
 * Ensure a credit account exists for a user.
 * @param {string} userId
 * @returns {Promise<Object>} // sanitized credit account
 */
export const getOrCreateCreditAccount = async (userId) => {
  let account = await CreditAccount.findOne({ userId }).lean().exec();
  if (!account) {
    account = await new CreditAccount({ userId }).save();
    return sanitizeCreditAccount(account.toObject());
  }
  return sanitizeCreditAccount(account);
};

/**
 * Get current balance for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const getBalance = async (userId) => {
  const account = await getOrCreateCreditAccount(userId);
  return account.balance;
};

/**
 * Top up credits (e.g., after Stripe success).
 * @param {string} userId
 * @param {number} amount
 * @param {string} stripeRef
 * @returns {Promise<number>} // new balance
 */
export const creditTopUp = async (userId, amount, stripeRef) => {
  await CreditTransaction.create({
    userId,
    amount,
    type: 'top_up',
    referenceId: stripeRef,
    description: `Top-up ${amount} credits`
  });

  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  ).lean().exec();
  return account.balance;
};

/**
 * Spend credits if sufficient balance.
 * @param {string} userId
 * @param {number} amount
 * @param {string} [description]
 * @returns {Promise<number>} // new balance
 */
export const spendCredits = async (userId, amount, description = '') => {
  const account = await CreditAccount.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (!account) {
    throw new Error('Insufficient credits');
  }

  await CreditTransaction.create({
    userId,
    amount: -amount,
    type: 'spend',
    description: description || `Spent ${amount} credits`
  });

  return account.balance;
};

/**
 * Refund credits to user.
 * @param {string} userId
 * @param {number} amount
 * @param {string} referenceId
 * @param {string} [description]
 * @returns {Promise<number>} // new balance
 */
export const refundCredits = async (userId, amount, referenceId, description = '') => {
  await CreditTransaction.create({
    userId,
    amount,
    type: 'refund',
    referenceId,
    description: description || `Refunded ${amount} credits`
  });

  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();

  return account.balance;
}; 