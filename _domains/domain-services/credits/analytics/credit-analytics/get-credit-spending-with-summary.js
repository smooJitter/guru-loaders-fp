import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  buildGroupStage,
  buildSortStage,
  bucketByDay,
  sumAbs,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Daily + total credit spend (dashboard-ready, refactored).
 * @param {Object} deps - Dependencies: CreditTransaction (model)
 * @returns {Function} (userId, days) => Promise<{ daily: Array, summary: Object }>
 */
const getCreditSpendingWithSummary = ({ CreditTransaction }) => async (userId, days = 30) => {
  validateAnalyticsInput({ requiredFields: ['userId'], dateFields: [] }, { userId });
  const timeWindow = createFieldTimeWindow({ field: 'createdAt', days });

  const facet = buildFacetStage({
    daily: [
      buildMatchStage({ userId, type: 'spend', ...timeWindow }),
      buildGroupStage(
        { day: bucketByDay('createdAt') },
        { spent: sumAbs('amount'), count: { $sum: 1 } }
      ),
      buildSortStage({ day: 1 })
    ],
    summary: [
      buildMatchStage({ userId, type: 'spend', ...timeWindow }),
      buildGroupStage(
        {},
        {
          total: sumAbs('amount'),
          days: { $addToSet: bucketByDay('createdAt') }
        }
      ),
      buildProjectStage({
        _id: 0,
        total: 1,
        daysCount: { $size: '$days' }
      })
    ]
  });

  const [result] = await CreditTransaction.aggregate([
    facet
  ]);

  return {
    daily: result.daily || [],
    summary: (result.summary && result.summary[0]) || { total: 0, daysCount: 0 }
  };
};

export default getCreditSpendingWithSummary; 