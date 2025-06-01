import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildSortStage,
  buildLookupStage,
  buildProjectStage,
  addPaginationStages,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * List top spenders, with pagination (refactored).
 * @param {Object} deps - Dependencies: CreditTransaction (model)
 * @returns {Function} ({ startDate, endDate, limit, skip }) => Promise<Array>
 */
const getTopCreditSpenders = ({ CreditTransaction }) => async ({ startDate, endDate, limit = 10, skip = 0 } = {}) => {
  validateAnalyticsInput({ requiredFields: [], dateFields: ['startDate', 'endDate'] }, { startDate, endDate });
  const timeWindow = (startDate || endDate)
    ? createFieldTimeWindow({
        field: 'createdAt',
        from: startDate,
        to: endDate
      })
    : {};

  const pipeline = [
    buildMatchStage({ type: 'spend', ...timeWindow }),
    buildGroupStage(
      { userId: '$userId' },
      { totalSpent: { $sum: { $abs: '$amount' } }, txnCount: { $sum: 1 } }
    ),
    buildSortStage({ totalSpent: -1 })
  ];
  addPaginationStages(pipeline, { skip, limit });
  pipeline.push(
    buildLookupStage({
      from: 'users',
      localField: '_id.userId',
      foreignField: '_id',
      as: 'user'
    }),
    { $unwind: '$user' },
    buildProjectStage({
      userId: '$_id.userId',
      email: '$user.email',
      totalSpent: 1,
      txnCount: 1
    })
  );

  const results = await CreditTransaction.aggregate(pipeline);
  return results ?? [];
};

export default getTopCreditSpenders; 