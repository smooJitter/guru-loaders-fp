// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_ACCOUNT: (msg) => `Invalid credit account: ${msg}`,
  INVALID_INPUT: 'Invalid input',
};

const sanitizeAccount = (account) => {
  // Logic to sanitize account (customize as needed)
  return account;
};

const validateAccount = (data) => {
  // Example validation logic (customize as needed)
  if (!data || !data.userId) return { isLeft: true };
  return { isLeft: false, value: data };
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

const createCreditAccount = async ({ context, ...data }) => {
  const { CreditAccount } = context.models;
  const validated = validateAccount(data);
  if (validated.isLeft) throw new Error(ERRORS.INVALID_ACCOUNT('Validation failed'));
  const account = await new CreditAccount(data).save();
  return sanitizeAccount(account.toObject());
};

const adjustCreditAccountBalance = async ({ context, userId, amount }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

export default withNamespace('userCreditsAccount', {
  createCreditAccount,
  adjustCreditAccountBalance
});
