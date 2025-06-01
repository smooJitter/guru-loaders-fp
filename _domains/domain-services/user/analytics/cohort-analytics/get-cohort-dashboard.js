import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildLookupStage,
  buildFacetStage,
  buildSortStage,
  buildPushArray,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Combined cohort + growth dashboard (configurable, optimized).
 * @param {Object} deps - Dependencies: Subscription (model)
 * @returns {Function} (options) => Promise<Object>
 * @param {string} [options.dateField='createdAt'] - Date field to filter on
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getCohortDashboard = ({ Subscription }) => async (options = {}) => {
  const {
    dateField = 'createdAt',
    startDate,
    endDate
  } = options;
  validateAnalyticsInput({ requiredFields: ['startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });

  const facet = buildFacetStage({
    retention: [
      buildMatchStage({ ...timeWindow }),
      buildLookupStage({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }),
      { $unwind: '$user' },
      buildGroupStage(
        {
          signupMonth: { $dateToString: { format: '%Y-%m', date: '$user.createdAt' } },
          status: '$status'
        },
        { count: { $sum: 1 } }
      ),
      buildGroupStage(
        { signupMonth: '$_id.signupMonth' },
        { statuses: buildPushArray({ status: '$_id.status', count: '$count' }) }
      ),
      buildSortStage({ 'signupMonth': 1 })
    ],
    growth: [
      buildMatchStage({ ...timeWindow }),
      buildGroupStage(
        { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
        { newSubs: { $sum: 1 } }
      ),
      buildProjectStage({ year: '$_id.year', month: '$_id.month', newSubs: 1, _id: 0 }),
      buildSortStage({ year: 1, month: 1 })
    ]
  });

  const [results] = await Subscription.aggregate([
    facet
  ]);
  return results || { retention: [], growth: [] };
};

export default getCohortDashboard; 