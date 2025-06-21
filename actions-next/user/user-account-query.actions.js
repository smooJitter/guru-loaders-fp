// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeAccount = (account) => {
  // Logic to sanitize account (customize as needed)
  return account;
};

import { withNamespace } from '../../src/utils/with-namespace.js';

const getAccountByUserId = async ({ context, userId }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  if (!userId) throw new Error(ERRORS.INVALID_INPUT);
  const account = await UserAccount.findOne({ userId }).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

const count = async ({ context, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.countDocuments(filter);
};

const sumField = async ({ context, field, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  const result = await UserAccount.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: `$${field}` } } }
  ]);
  return Array.isArray(result) && result[0]?.total ? result[0].total : 0;
};

const groupBy = async ({ context, groupField, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.aggregate([
    { $match: filter },
    { $group: { _id: `$${groupField}`, count: { $sum: 1 } } }
  ]);
};

const distinct = async ({ context, field, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.distinct(field, filter);
};

const aggregate = async ({ context, pipeline }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.aggregate(pipeline);
};

const facetedStats = async ({ context, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.aggregate([
    { $match: filter },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byRole: [{ $unwind: '$roles' }, { $group: { _id: '$roles', count: { $sum: 1 } } }]
      }
    }
  ]);
};

const countByDay = async ({ context, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const topN = async ({ context, field, limit = 5, filter = {} }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  return await UserAccount.aggregate([
    { $match: filter },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

export default withNamespace('userAccount', {
  getAccountByUserId,
  count,
  sumField,
  groupBy,
  distinct,
  aggregate,
  facetedStats,
  countByDay,
  topN
});
