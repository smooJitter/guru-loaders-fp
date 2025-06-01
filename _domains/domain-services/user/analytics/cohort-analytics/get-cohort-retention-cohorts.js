import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildProjectStage,
  buildSortStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get retention cohorts (configurable, optimized).
 * @param {Object} deps - Dependencies: Subscription (model)
 * @returns {Function} (options) => Promise<Array<{ signupMonth: string, retained: number }>>
 * @param {string} [options.dateField='createdAt'] - Date field to filter on
 * @param {string|Date} [options.startDate]
 * @param {string|Date} [options.endDate]
 */
const getCohortRetentionCohorts = ({ Subscription }) => async (options = {}) => {
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
      { signupMonth: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } } },
      { retained: { $sum: 1 } }
    ),
    buildProjectStage({ signupMonth: '$_id.signupMonth', retained: 1, _id: 0 }),
    buildSortStage({ signupMonth: 1 })
  ];
  const results = await Subscription.aggregate(pipeline);
  return results ?? [];
};

export default getCohortRetentionCohorts; 