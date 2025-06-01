import { buildBucketStage, validateAnalyticsInput } from '../../../utils/analytics/shared-utils.js';

/**
 * Bucket users by balance ranges (refactored).
 * @param {Object} deps - Dependencies: CreditAccount (model)
 * @returns {Function} (options) => Promise<Array>
 *
 * @param {Array<number>} [options.boundaries] - Bucket boundaries (default: [0,50,100,500,1000,5000,10000])
 * @param {string} [options.groupBy] - Field to bucket by (default: '$balance')
 */
const getCreditDistribution = ({ CreditAccount }) => async (options = {}) => {
  const {
    boundaries = [0,50,100,500,1000,5000,10000],
    groupBy = '$balance'
  } = options;
  validateAnalyticsInput({ requiredFields: [], dateFields: [] }, { boundaries, groupBy });

  const pipeline = [
    buildBucketStage({
      groupBy,
      boundaries,
      default: '>10K',
      output: {
        userCount: { $sum: 1 },
        avg: { $avg: '$balance' },
        max: { $max: '$balance' }
      }
    })
  ];

  const results = await CreditAccount.aggregate(pipeline);
  return results ?? [];
};

export default getCreditDistribution; 