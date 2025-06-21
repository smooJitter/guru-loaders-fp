// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

const getCreditBalanceHistory = async ({ context, startDate, endDate, interval = 'day', userId = null }) => {
  const { CreditTransaction } = context.models;
  const match = {};
  if (userId) match.userId = userId;
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const dateFormat = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-%U' : '%Y-%m-%d';
  const pipeline = [
    { $match: match },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        balance: { $last: '$balance' },
        transactions: { $push: '$$ROOT' }
      }
    },
    { $sort: { _id: 1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditUsageTrends = async ({ context, startDate, endDate, interval = 'month' }) => {
  const { CreditTransaction } = context.models;
  const match = {};
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const dateFormat = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-%U' : '%Y-%m-%d';
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalTopUp: {
          $sum: {
            $cond: [{ $eq: ['$type', 'top_up'] }, '$amount', 0]
          }
        },
        totalSpend: {
          $sum: {
            $cond: [{ $eq: ['$type', 'spend'] }, { $abs: '$amount' }, 0]
          }
        },
        totalRefund: {
          $sum: {
            $cond: [{ $eq: ['$type', 'refund'] }, '$amount', 0]
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditTransactionBreakdown = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = {};
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditExpirationAnalysis = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = { type: 'expiration' };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalExpired: { $sum: { $abs: '$amount' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalExpired: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditTransferAnalysis = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = { type: { $in: ['transfer_in', 'transfer_out', 'bulk_transfer_out'] } };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditTopUpAnalysis = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = { type: 'top_up' };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalTopUp: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalTopUp: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditSpendAnalysis = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = { type: 'spend' };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalSpent: { $sum: { $abs: '$amount' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditHealthMetrics = async ({ context }) => {
  const { CreditAccount } = context.models;
  const pipeline = [
    {
      $facet: {
        totalAccounts: [
          { $count: 'count' }
        ],
        activeAccounts: [
          { $match: { balance: { $gt: 0 } } },
          { $count: 'count' }
        ],
        totalCredits: [
          { $group: { _id: null, total: { $sum: '$balance' } } }
        ],
        recentTransactions: [
          { $sort: { createdAt: -1 } },
          { $limit: 100 },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              total: { $sum: '$amount' }
            }
          }
        ]
      }
    }
  ];
  const [result] = await CreditAccount.aggregate(pipeline);
  return {
    totalAccounts: result.totalAccounts[0]?.count || 0,
    activeAccounts: result.activeAccounts[0]?.count || 0,
    totalCredits: result.totalCredits[0]?.total || 0,
    recentTransactions: result.recentTransactions
  };
};

const getCreditVelocityAnalysis = async ({ context, startDate, endDate, interval = 'day' }) => {
  const { CreditTransaction } = context.models;
  const match = {};
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const dateFormat = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-%U' : '%Y-%m-%d';
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        creditsSpent: {
          $sum: {
            $cond: [{ $eq: ['$type', 'spend'] }, { $abs: '$amount' }, 0]
          }
        },
        creditsToppedUp: {
          $sum: {
            $cond: [{ $eq: ['$type', 'top_up'] }, '$amount', 0]
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getDormantAccountDetection = async ({ context, sinceDate }) => {
  const { CreditAccount, CreditTransaction } = context.models;
  const activeUserIds = await CreditTransaction.distinct('userId', {
    createdAt: { $gte: new Date(sinceDate) }
  });
  return CreditAccount.find({ userId: { $nin: activeUserIds } }).lean().exec();
};

const getCreditChurnRate = async ({ context, windowStart, windowEnd }) => {
  const { CreditAccount, CreditTransaction } = context.models;
  const zeroBalanceUsers = await CreditAccount.find({ balance: { $lte: 0 } }).distinct('userId');
  const toppedUpUsers = await CreditTransaction.distinct('userId', {
    type: 'top_up',
    createdAt: { $gte: new Date(windowStart), $lte: new Date(windowEnd) }
  });
  const churnedUsers = zeroBalanceUsers.filter(userId => !toppedUpUsers.includes(userId));
  return {
    churnedUserIds: churnedUsers,
    churnRate: zeroBalanceUsers.length ? churnedUsers.length / zeroBalanceUsers.length : 0
  };
};

const getCreditExpiryForecast = async ({ context, expiryField = 'expiresAt', days = 30 }) => {
  const { CreditAccount } = context.models;
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return CreditAccount.find({
    [expiryField]: { $gte: now, $lte: future },
    balance: { $gt: 0 }
  }).lean().exec();
};

const getTopCreditUsers = async ({ context, startDate, endDate, type = 'spend', limit = 10 }) => {
  const { CreditTransaction } = context.models;
  const match = { type };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$userId',
        total: { $sum: { $abs: '$amount' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: limit }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditSourceAttribution = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = {};
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$source',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getAnomalousCreditActivity = async ({ context, threshold = 3, windowDays = 1 }) => {
  const { CreditTransaction } = context.models;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const pipeline = [
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$userId',
        txnCount: { $sum: 1 },
        total: { $sum: { $abs: '$amount' } }
      }
    },
    { $match: { txnCount: { $gte: threshold } } },
    { $sort: { txnCount: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

const getCreditLifetimeValue = async ({ context, startDate, endDate }) => {
  const { CreditTransaction } = context.models;
  const match = {};
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalSpent: {
          $sum: {
            $cond: [{ $eq: ['$type', 'spend'] }, { $abs: '$amount' }, 0]
          }
        },
        firstTxn: { $min: '$createdAt' },
        lastTxn: { $max: '$createdAt' },
        txnCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

export default withNamespace('userCreditsAnalytics', {
  getCreditBalanceHistory,
  getCreditUsageTrends,
  getCreditTransactionBreakdown,
  getCreditExpirationAnalysis,
  getCreditTransferAnalysis,
  getCreditTopUpAnalysis,
  getCreditSpendAnalysis,
  getCreditHealthMetrics,
  getCreditVelocityAnalysis,
  getDormantAccountDetection,
  getCreditChurnRate,
  getCreditExpiryForecast,
  getTopCreditUsers,
  getCreditSourceAttribution,
  getAnomalousCreditActivity,
  getCreditLifetimeValue
});
