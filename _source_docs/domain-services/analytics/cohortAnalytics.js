import { parseISO } from 'date-fns';
import Subscription from '../../models/Subscription.js';

/**
 * Retention cohorts by signup month and status counts.
 * @returns {Promise<Array<{ _id: string, statuses: Array<{ status: string, count: number }> }>>}
 */
export const getRetentionCohorts = async () => {
  const results = await Subscription.aggregate([
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
      $group: {
        _id: {
          signupMonth: { $dateToString: { format: '%Y-%m', date: '$user.createdAt' } },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.signupMonth',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
  return results ?? [];
};

/**
 * Compute retention rates (%) for each cohort.
 * @returns {Promise<Array<{ signupMonth: string, statuses: Array<{ status: string, count: number, percent: string }> }>>}
 */
export const getRetentionRates = async () => {
  const cohorts = await getRetentionCohorts();
  return cohorts.map(({ _id: signupMonth, statuses }) => {
    const total = statuses.reduce((sum, s) => sum + s.count, 0);
    return {
      signupMonth,
      statuses: statuses.map(s => ({
        status: s.status,
        count: s.count,
        percent: ((s.count / total) * 100).toFixed(2)
      }))
    };
  });
};

/**
 * Monthly churn and growth over a date range.
 * @param {Object} params
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @returns {Promise<Object>} // { churned: Array, started: Array }
 */
export const getMonthlyChurnAndGrowth = async ({ startDate, endDate } = {}) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const [result] = await Subscription.aggregate([
    {
      $facet: {
        churned: [
          { $match: {
            status: 'canceled',
            updatedAt: {
              $gte: start,
              $lt:  end
            }
          }},
          {
            $group: {
              _id: {
                year:  { $year: '$updatedAt' },
                month: { $month: '$updatedAt' }
              },
              churned: { $sum: 1 }
            }
          }
        ],
        started: [
          { $match: {
            createdAt: {
              $gte: start,
              $lt:  end
            }
          }},
          {
            $group: {
              _id: {
                year:  { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              newSubs: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);
  return result || { churned: [], started: [] };
};

/**
 * Combined cohort + growth dashboard.
 * @param {Object} params
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @returns {Promise<Object>} // { retention: Array, growth: Array }
 */
export const getCohortDashboard = async ({ startDate, endDate } = {}) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const [results] = await Subscription.aggregate([
    {
      $facet: {
        retention: [
          { $match: { createdAt: { $gte: start, $lt: end } } },
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
            $group: {
              _id: {
                signupMonth: { $dateToString: { format: '%Y-%m', date: '$user.createdAt' } },
                status: '$status'
              },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: '$_id.signupMonth',
              statuses: { $push: { status: '$_id.status', count: '$count' } }
            }
          },
          { $sort: { '_id': 1 } }
        ],
        growth: [
          { $match: { createdAt: { $gte: start, $lt: end } } },
          {
            $group: {
              _id: {
                year:  { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              newSubs: { $sum: 1 }
            }
          },
          { $project: { year: '$_id.year', month: '$_id.month', newSubs: 1, _id: 0 } },
          { $sort: { year: 1, month: 1 } }
        ]
      }
    }
  ]);
  return results || { retention: [], growth: [] };
}; 