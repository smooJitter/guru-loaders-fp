import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildSortStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get retention rates (configurable, optimized).
 * @param {Object} deps - Dependencies: Subscription (model)
 * @returns {Function} (options) => Promise<Array<{ signupMonth: string, retained: number, churned: number, retentionRate: number }>>
 * @param {string} [options.dateField='createdAt'] - Date field to filter on
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getCohortRetentionRates = ({ Subscription }) => async (options = {}) => {
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
      { signupMonth: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } }, status: '$status' },
      { count: { $sum: 1 } }
    ),
    buildGroupStage(
      { signupMonth: '$_id.signupMonth' },
      {
        retained: { $sum: { $cond: [{ $eq: ['$_id.status', 'active'] }, '$count', 0] } },
        churned: { $sum: { $cond: [{ $eq: ['$_id.status', 'canceled'] }, '$count', 0] } }
      }
    ),
    buildProjectStage({
      signupMonth: '$_id.signupMonth',
      retained: 1,
      churned: 1,
      retentionRate: {
        $cond: [
          { $eq: [{ $add: ['$retained', '$churned'] }, 0] },
          0,
          { $divide: ['$retained', { $add: ['$retained', '$churned'] }] }
        ]
      },
      _id: 0
    }),
    buildSortStage({ signupMonth: 1 })
  ];
  const results = await Subscription.aggregate(pipeline);
  return results ?? [];
};

export default getCohortRetentionRates; 