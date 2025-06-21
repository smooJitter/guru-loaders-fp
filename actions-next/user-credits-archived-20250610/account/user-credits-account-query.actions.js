// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeAccount = (account) => {
  // Logic to sanitize account (customize as needed)
  return account;
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

const getOrCreateAccount = async ({ context, userId }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

const getCreditAccountByUser = async ({ context, userId }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

const getBalance = async ({ context, userId }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return account ? account.balance : 0;
};

export default withNamespace('userCreditsAccount', {
  getOrCreateAccount,
  getCreditAccountByUser,
  getBalance
});
