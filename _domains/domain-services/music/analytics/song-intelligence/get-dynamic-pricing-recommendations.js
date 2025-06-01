import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  buildGroupStage,
  buildProjectStage,
  buildLookupStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get dynamic pricing recommendations (configurable, optimized).
 * @param {Object} deps - Dependencies: db (service), ObjectId (class)
 * @returns {Function} (eventId, options) => Promise<any>
 * @param {number} [options.hours=24] - Time window in hours (default: 24)
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getDynamicPricingRecommendations = ({ db, ObjectId }) => async (eventId, { hours = 24, metrics = null } = {}) => {
  validateAnalyticsInput({ requiredFields: ['eventId'] }, { eventId });
  const timeWindow = createFieldTimeWindow({ field: 'timestamp', hours });

  const allMetrics = {
    priceSensitivity: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
      buildGroupStage(
        { songId: '$songId', pricePoint: {
          $switch: {
            branches: [
              { case: { $lt: ['$creditAmount', 10] }, then: 'low' },
              { case: { $lt: ['$creditAmount', 50] }, then: 'medium' },
              { case: { $lt: ['$creditAmount', 100] }, then: 'high' }
            ],
            default: 'premium'
          }
        } },
        {
          requestCount: { $sum: 1 },
          conversionRate: { $avg: { $cond: [{ $gt: ['$creditAmount', 0] }, 1, 0] } }
        }
      )
    ],
    timeBasedPricing: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
      buildGroupStage(
        { hour: { $hour: '$timestamp' }, songId: '$songId' },
        {
          avgCredits: { $avg: '$creditAmount' },
          maxCredits: { $max: '$creditAmount' },
          requestCount: { $sum: 1 }
        }
      ),
      buildProjectStage({
        timeBlock: '$_id.hour',
        priceElasticity: {
          $divide: [
            { $subtract: ['$maxCredits', '$avgCredits'] },
            '$avgCredits'
          ]
        },
        demandScore: {
          $multiply: ['$requestCount', '$avgCredits']
        }
      })
    ],
    genrePricing: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
      buildLookupStage({
        from: 'songs',
        localField: 'songId',
        foreignField: '_id',
        as: 'song'
      }),
      { $unwind: '$song' },
      buildGroupStage(
        { genre: '$song.genre' },
        {
          avgCredits: { $avg: '$creditAmount' },
          maxCredits: { $max: '$creditAmount' },
          totalRequests: { $sum: 1 },
          uniqueRequesters: { $addToSet: '$userId' }
        }
      ),
      buildProjectStage({
        genre: '$_id',
        priceRange: {
          suggested: '$avgCredits',
          ceiling: '$maxCredits'
        },
        demandMetrics: {
          totalRequests: '$totalRequests',
          uniqueRequesters: { $size: '$uniqueRequesters' }
        }
      })
    ]
  };
  const facetMetrics = metrics
    ? Object.fromEntries(Object.entries(allMetrics).filter(([k]) => metrics.includes(k)))
    : allMetrics;

  const pipeline = [
    buildFacetStage(facetMetrics),
    { $project: { _id: 0 } }
  ];

  return db.songRequests.aggregate(pipeline);
};

export default getDynamicPricingRecommendations; 