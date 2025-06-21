// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_CREDIT_TRANSACTION: (msg) => `Invalid credit transaction: ${msg}`,
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  INVALID_INPUT: 'Invalid input',
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

const bulkCreateTransactions = async ({ context, transactions }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
  const validated = transactions.map(txn => validateTransaction(txn));
  const invalid = validated.find(v => v.isLeft);
  if (invalid) throw new Error(invalid.error);
  const result = await CreditTransaction.insertMany(transactions);
  return { count: result.length };
};

const bulkExpireCredits = async ({ context, userIds, amount, reason }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const session = await CreditAccount.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      // Update accounts
      const accountResult = await CreditAccount.updateMany(
        {
          userId: { $in: userIds },
          balance: { $gte: amount }
        },
        {
          $inc: { balance: -amount },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
      // Create transactions
      const transactions = userIds.map(userId => ({
        userId,
        amount: -amount,
        type: 'expiration',
        description: reason || `Credits expired: ${amount}`
      }));
      await CreditTransaction.insertMany(transactions, { session });
      result = {
        matched: accountResult.matchedCount,
        modified: accountResult.modifiedCount
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
};

const bulkTransferCredits = async ({ context, fromUserId, toUserIds, amountPerUser, description = '' }) => {
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const session = await CreditAccount.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      const totalAmount = amountPerUser * toUserIds.length;
      // Check and update sender balance
      const fromAccount = await CreditAccount.findOneAndUpdate(
        {
          userId: fromUserId,
          balance: { $gte: totalAmount }
        },
        {
          $inc: { balance: -totalAmount },
          $set: { updatedAt: new Date() }
        },
        { new: true, session }
      ).lean().exec();
      if (!fromAccount) throw new Error(ERRORS.INSUFFICIENT_CREDITS);
      // Update receiver balances
      await CreditAccount.updateMany(
        { userId: { $in: toUserIds } },
        {
          $inc: { balance: amountPerUser },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
      // Create transactions
      const transactions = [
        // Sender transaction
        {
          userId: fromUserId,
          amount: -totalAmount,
          type: 'bulk_transfer_out',
          description: description || `Bulk transferred ${totalAmount} credits to ${toUserIds.length} users`
        },
        // Receiver transactions
        ...toUserIds.map(toUserId => ({
          userId: toUserId,
          amount: amountPerUser,
          type: 'transfer_in',
          description: description || `Received ${amountPerUser} credits from bulk transfer`
        }))
      ];
      await CreditTransaction.insertMany(transactions, { session });
      result = {
        fromUser: {
          userId: fromUserId,
          newBalance: fromAccount.balance - totalAmount
        },
        recipients: toUserIds.length,
        amountPerUser,
        totalAmount
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
};

export default withNamespace('userCreditsTransactions', {
  bulkCreateTransactions,
  bulkExpireCredits,
  bulkTransferCredits
}); 