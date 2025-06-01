import getCreditSpendingHistory from './get-credit-spending-history.js';
import getCreditTrend from './get-credit-trend.js';
import getTopCreditSpenders from './get-top-credit-spenders.js';
import getCreditDistribution from './get-credit-distribution.js';
import getCreditSpendingWithSummary from './get-credit-spending-with-summary.js';
import { parseISO, subDays } from 'date-fns';
import assert from 'assert';

export default (context) => {
  const CreditTransaction = context.models.CreditTransaction;
  const CreditAccount = context.models.CreditAccount;
  return {
    getCreditSpendingHistory: getCreditSpendingHistory({ CreditTransaction, subDays, assert }),
    getCreditTrend: getCreditTrend({ CreditTransaction, subDays, assert }),
    getTopCreditSpenders: getTopCreditSpenders({ CreditTransaction, parseISO }),
    getCreditDistribution: getCreditDistribution({ CreditAccount }),
    getCreditSpendingWithSummary: getCreditSpendingWithSummary({ CreditTransaction, subDays, assert })
  };
}; 