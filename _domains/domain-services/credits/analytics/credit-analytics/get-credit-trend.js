import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildSortStage,
  bucketByDay,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get daily trend of both top-ups and spends (refactored).
 * @param {Object} deps - Dependencies: CreditTransaction (model)
 * @returns {Function} ({ userId, days }) => Promise<{ cacheKey: string, data: Array }>
 */
const getCreditTrend = ({ CreditTransaction }) => async ({ userId, days = 30 } = {}) => {
  validateAnalyticsInput({ requiredFields: ['userId'], dateFields: [] }, { userId });
  const timeWindow = createFieldTimeWindow({ field: 'createdAt', days });

  const pipeline = [
    buildMatchStage({ userId, ...timeWindow }),
    buildGroupStage(
      { date: bucketByDay('createdAt'), type: '$type' },
      { total: { $sum: '$amount' } }
    ),
    buildGroupStage(
      { date: '$_id.date' },
      { breakdown: { $push: { type: '$_id.type', total: '$total' } } }
    ),
    buildSortStage({ 'date': 1 })
  ];

  const data = await CreditTransaction.aggregate(pipeline);
  return { cacheKey: `creditTrend:${userId}:${days}`, data };
};

export default getCreditTrend; 