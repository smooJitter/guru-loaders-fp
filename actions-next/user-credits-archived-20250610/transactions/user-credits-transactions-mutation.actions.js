// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_CREDIT_TRANSACTION: (msg) => `Invalid credit transaction: ${msg}`,
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  INVALID_INPUT: 'Invalid input',
};

const CREDIT_TRANSACTION_TYPES = {
  TOP_UP: 'top_up',
  SPEND: 'spend',
  TRANSFER_OUT: 'transfer_out',
  TRANSFER_IN: 'transfer_in',
  REFUND: 'refund',
  EXPIRATION: 'expiration',
};

const sanitizeTransaction = (txn) => {
  if (!txn) return txn;
  const { __v, ...rest } = txn;
  return rest;
};

const validateTransaction = (data) => {
  if (!data || typeof data !== 'object' || !data.userId || typeof data.amount !== 'number' || !data.type) {
    return { isLeft: true, error: ERRORS.INVALID_CREDIT_TRANSACTION('Missing required fields') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

const createCreditTransaction = async ({ context, ...data }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
  const validation = validateTransaction(data);
  if (validation.isLeft) throw new Error(validation.error);
  const transaction = await new CreditTransaction(data).save();
  return sanitizeTransaction(transaction.toObject());
};

const creditTopUp = async ({ context, userId, amount, stripeRef }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  await CreditTransaction.create({
    userId,
    amount,
    type: CREDIT_TRANSACTION_TYPES.TOP_UP,
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

const spendCredits = async ({ context, userId, amount, description = '' }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const account = await CreditAccount.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (!account) throw new Error(ERRORS.INSUFFICIENT_CREDITS);
  await CreditTransaction.create({
    userId,
    amount: -amount,
    type: CREDIT_TRANSACTION_TYPES.SPEND,
    description: description || `Spent ${amount} credits`
  });
  return account.balance;
};

const refundCredits = async ({ context, userId, amount, referenceId, description = '' }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  await CreditTransaction.create({
    userId,
    amount,
    type: CREDIT_TRANSACTION_TYPES.REFUND,
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

const expireCredits = async ({ context, userId, amount, reason }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const account = await CreditAccount.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (!account) throw new Error(ERRORS.INSUFFICIENT_CREDITS);
  await CreditTransaction.create({
    userId,
    amount: -amount,
    type: CREDIT_TRANSACTION_TYPES.EXPIRATION,
    description: reason || `Credits expired: ${amount}`
  });
  return account.balance;
};

const transferCredits = async ({ context, fromUserId, toUserId, amount, description = '' }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const session = await CreditAccount.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      // Deduct from sender
      const fromAccount = await CreditAccount.findOneAndUpdate(
        { userId: fromUserId, balance: { $gte: amount } },
        { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
        { new: true, session }
      ).lean().exec();
      if (!fromAccount) throw new Error(ERRORS.INSUFFICIENT_CREDITS);
      // Add to receiver
      const toAccount = await CreditAccount.findOneAndUpdate(
        { userId: toUserId },
        { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
        { new: true, session }
      ).lean().exec();
      // Create transactions
      await Promise.all([
        CreditTransaction.create([{
          userId: fromUserId,
          amount: -amount,
          type: CREDIT_TRANSACTION_TYPES.TRANSFER_OUT,
          description: description || `Transferred ${amount} credits to user ${toUserId}`
        }], { session }),
        CreditTransaction.create([{
          userId: toUserId,
          amount,
          type: CREDIT_TRANSACTION_TYPES.TRANSFER_IN,
          description: description || `Received ${amount} credits from user ${fromUserId}`
        }], { session })
      ]);
      result = {
        fromUser: { userId: fromUserId, newBalance: fromAccount.balance },
        toUser: { userId: toUserId, newBalance: toAccount.balance }
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
};

export default withNamespace('userCreditsTransactions', {
  createCreditTransaction,
  creditTopUp,
  spendCredits,
  refundCredits,
  expireCredits,
  transferCredits
});
