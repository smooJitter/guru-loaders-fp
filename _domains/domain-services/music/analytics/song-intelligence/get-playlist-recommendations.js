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
 * Get intelligent playlist recommendations (configurable, optimized).
 * @param {Object} deps - Dependencies: db (service), ObjectId (class)
 * @returns {Function} (eventId, options) => Promise<any>
 * @param {number} [options.hours=1] - Time window in hours for vibeMetrics (default: 1)
 * @param {number} [options.requestHours=2] - Time window in hours for requestPatterns (default: 2)
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getPlaylistRecommendations = ({ db, ObjectId }) => async (eventId, {
  hours = 1,
  requestHours = 2,
  metrics = null
} = {}) => {
  validateAnalyticsInput({ requiredFields: ['eventId'] }, { eventId });
  const timeWindowVibe = createFieldTimeWindow({ field: 'timestamp', hours });
  const timeWindowRequest = createFieldTimeWindow({ field: 'timestamp', hours: requestHours });

  const allMetrics = {
    vibeMetrics: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindowVibe }),
      buildLookupStage({
        from: 'songs',
        localField: 'songId',
        foreignField: '_id',
        as: 'song'
      }),
      { $unwind: '$song' },
      buildGroupStage(
        {},
        {
          avgTempo: { $avg: '$song.tempo' },
          avgEnergy: { $avg: '$song.energy' },
          dominantGenres: { $addToSet: '$song.genre' },
          successfulMoods: {
            $push: {
              $cond: [
                { $gt: ['$creditAmount', 0] },
                '$song.mood',
                null
              ]
            }
          }
        }
      )
    ],
    requestPatterns: [
      buildMatchStage({
        eventId: new ObjectId(eventId),
        requestType: 'explicit',
        ...timeWindowRequest
      }),
      buildGroupStage(
        { songId: '$songId' },
        {
          requestCount: { $sum: 1 },
          totalCredits: { $sum: '$creditAmount' },
          uniqueRequesters: { $addToSet: '$userId' }
        }
      ),
      buildSortStage({ totalCredits: -1, requestCount: -1 })
    ],
    crowdEnergy: [
      buildMatchStage({ eventId: new ObjectId(eventId) }),
      buildGroupStage(
        { hour: { $hour: '$timestamp' }, songId: '$songId' },
        {
          engagement: {
            $sum: {
              $add: [
                { $cond: [{ $eq: ['$direction', 'right'] }, 1, 0] },
                { $multiply: ['$creditAmount', 0.2] }
              ]
            }
          },
          responseTime: { $avg: '$responseTime' }
        }
      ),
      buildProjectStage({
        timeBlock: '$_id.hour',
        energyScore: {
          $multiply: [
            '$engagement',
            { $divide: [1, { $add: ['$responseTime', 1] }] }
          ]
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

export default getPlaylistRecommendations; 