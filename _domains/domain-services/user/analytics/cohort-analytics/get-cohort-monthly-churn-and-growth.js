import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildSortStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get monthly churn and growth (configurable, optimized).
 * @param {Object} deps - Dependencies: Subscription (model)
 * @returns {Function} (options) => Promise<Array<{ year: number, month: number, churned: number, newSubs: number }>>
 * @param {string} [options.dateField='createdAt'] - Date field to filter on
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getCohortMonthlyChurnAndGrowth = ({ Subscription }) => async (options = {}) => {
  const {
    dateField = 'createdAt',
    startDate,
    endDate
  } = options;
  validateAnalyticsInput({ requiredFields: ['startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });

  const pipeline = [
    buildMatchStage({ ...timeWindow }),
    buildGroupStage(
      { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` }, status: '$status' },
      { count: { $sum: 1 } }
    ),
    buildGroupStage(
      { year: '$_id.year', month: '$_id.month' },
      {
        churned: {
          $sum: { $cond: [{ $eq: ['$_id.status', 'canceled'] }, '$count', 0] }
        },
        newSubs: {
          $sum: { $cond: [{ $eq: ['$_id.status', 'active'] }, '$count', 0] }
        }
      }
    ),
    buildProjectStage({ year: '$_id.year', month: '$_id.month', churned: 1, newSubs: 1, _id: 0 }),
    buildSortStage({ year: 1, month: 1 })
  ];
  const results = await Subscription.aggregate(pipeline);
  return results ?? [];
};

export default getCohortMonthlyChurnAndGrowth; 