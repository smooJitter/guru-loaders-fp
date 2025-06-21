// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

const bulkAdjustBalances = async ({ context, adjustments }) => {
  const { CreditAccount } = context.models;
  const operations = adjustments.map(({ userId, amount }) => ({
    updateOne: {
      filter: { userId },
      update: { $inc: { balance: amount }, $set: { updatedAt: new Date() } }
    }
  }));
  const result = await CreditAccount.bulkWrite(operations);
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('userCreditsAccount', {
  bulkAdjustBalances
});
