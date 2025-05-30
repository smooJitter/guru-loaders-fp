import { parseISO } from 'date-fns';
import Subscription from '../../models/Subscription.js';

const STATUS_ACTIVE = 'active';
const STATUS_CANCELED = 'canceled';

/**
 * Count subscriptions grouped by status.
 * @returns {Promise<Array<{ status: string, count: number }>>}
 */
export const getSubscriptionStatusSummary = async () => {
  const results = await Subscription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  return results ?? [];
};

/**
 * Count active subscriptions per plan.
 * @returns {Promise<Array<{ planName: string, activeCount: number }>>}
 */
export const countActiveSubscriptionsPerPlan = async () => {
  const results = await Subscription.aggregate([
    { $match: { status: STATUS_ACTIVE } },
    {
      $group: {
        _id: '$planId',
        activeCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: '_id',
        foreignField: '_id',
        as: 'plan'
      }
    },
    { $unwind: '$plan' },
    {
      $project: {
        planName: '$plan.name',
        activeCount: 1
      }
    },
    { $sort: { activeCount: -1 } }
  ]);
  return results ?? [];
};

/**
 * List churned users with pagination.
 * @param {Object} params
 * @param {string} [params.sinceDate]
 * @param {number} [params.limit]
 * @param {number} [params.skip]
 * @returns {Promise<Array<{ userId: string, email: string, canceledAt: Date }>>}
 */
export const findChurnedUsers = async ({ sinceDate, limit = 50, skip = 0 } = {}) => {
  const match = { status: STATUS_CANCELED };
  if (sinceDate) match.currentPeriodEnd = { $lt: parseISO(sinceDate) };

  const results = await Subscription.aggregate([
    { $match: match },
    { $sort: { currentPeriodEnd: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$user._id',
        email: '$user.email',
        canceledAt: '$currentPeriodEnd'
      }
    }
  ]);
  return results ?? [];
};

/**
 * Snapshot of subscription health.
 * @returns {Promise<Object>} // { activeByPlan, totalActive, totalCanceled }
 */
export const getSubscriptionSnapshot = async () => {
  const [result] = await Subscription.aggregate([
    {
      $facet: {
        activeByPlan: [
          { $match: { status: STATUS_ACTIVE } },
          {
            $group: {
              _id: '$planId',
              total: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'plans',
              localField: '_id',
              foreignField: '_id',
              as: 'plan'
            }
          },
          { $unwind: '$plan' },
          {
            $project: {
              planId: '$_id',
              planName: '$plan.name',
              total: 1
            }
          }
        ],
        totalActive: [
          { $match: { status: STATUS_ACTIVE } },
          { $count: 'count' }
        ],
        totalCanceled: [
          { $match: { status: STATUS_CANCELED } },
          { $count: 'count' }
        ]
      }
    }
  ]);
  return result || { activeByPlan: [], totalActive: [], totalCanceled: [] };
}; 