import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  buildGroupStage,
  buildProjectStage,
  buildLookupStage,
  buildConditionalSum,
  buildPushArray,
  buildAddToSetArray,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get real-time song engagement metrics (configurable, optimized).
 * @param {Object} deps - Dependencies: db (service), ObjectId (class)
 * @returns {Function} (eventId, options) => Promise<any>
 * @param {number} [options.hours=4] - Time window in hours (default: 4)
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getSongEngagementMetrics = ({ db, ObjectId }) => async (eventId, { hours = 4, metrics = null } = {}) => {
  validateAnalyticsInput({ requiredFields: ['eventId'] }, { eventId });
  const timeWindow = createFieldTimeWindow({ field: 'timestamp', hours });

  const allMetrics = {
    swipeMetrics: [
      buildGroupStage(
        { songId: '$songId' },
        {
          rightSwipes: buildConditionalSum([{ $eq: ['$direction', 'right'] }, 1, 0]),
          leftSwipes: buildConditionalSum([{ $eq: ['$direction', 'left'] }, 1, 0]),
          totalSwipes: { $sum: 1 },
          uniqueUsers: buildAddToSetArray('$userId'),
          avgResponseTime: { $avg: '$responseTime' }
        }
      ),
      buildProjectStage({
        songId: '$_id',
        matchRate: {
          $multiply: [
            { $divide: ['$rightSwipes', '$totalSwipes'] },
            100
          ]
        },
        engagementScore: {
          $multiply: [
            {
              $divide: [
                { $size: '$uniqueUsers' },
                { $add: ['$avgResponseTime', 1] }
              ]
            },
            100
          ]
        }
      })
    ],
    creditMetrics: [
      buildMatchStage({ creditAmount: { $gt: 0 } }),
      buildGroupStage(
        { songId: '$songId' },
        {
          totalCredits: { $sum: '$creditAmount' },
          tipCount: { $sum: 1 },
          uniqueTippers: buildAddToSetArray('$userId'),
          avgTipAmount: { $avg: '$creditAmount' },
          maxTip: { $max: '$creditAmount' }
        }
      ),
      buildProjectStage({
        songId: '$_id',
        tipperCount: { $size: '$uniqueTippers' },
        avgTipPerUser: {
          $divide: ['$totalCredits', { $size: '$uniqueTippers' }]
        },
        tipFrequency: {
          $divide: ['$tipCount', { $size: '$uniqueTippers' }]
        }
      })
    ],
    timePatterns: [
      buildGroupStage(
        { hour: { $hour: '$timestamp' }, songId: '$songId' },
        {
          engagement: {
            $sum: {
              $add: [
                { $cond: [{ $eq: ['$direction', 'right'] }, 2, 0] },
                { $cond: [{ $gt: ['$creditAmount', 0] }, 3, 0] }
              ]
            }
          }
        }
      ),
      buildGroupStage(
        { songId: '$_id.songId' },
        {
          hourlyPattern: buildPushArray({ hour: '$_id.hour', engagement: '$engagement' }),
          peakHours: buildPushArray({
            $cond: [
              { $gt: ['$engagement', 5] },
              '$_id.hour',
              null
            ]
          })
        }
      )
    ],
    genreMetrics: [
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
          totalEngagement: {
            $sum: {
              $add: [
                { $cond: [{ $eq: ['$direction', 'right'] }, 2, 0] },
                { $multiply: ['$creditAmount', 0.5] }
              ]
            }
          },
          songCount: buildAddToSetArray('$songId'),
          avgCredits: { $avg: '$creditAmount' }
        }
      ),
      buildProjectStage({
        genre: '$_id',
        engagementPerSong: {
          $divide: ['$totalEngagement', { $size: '$songCount' }]
        },
        popularity: {
          $multiply: [
            {
              $divide: [
                '$totalEngagement',
                { $add: [{ $size: '$songCount' }, 1] }
              ]
            },
            '$avgCredits'
          ]
        }
      })
    ]
  };
  const facetMetrics = metrics
    ? Object.fromEntries(Object.entries(allMetrics).filter(([k]) => metrics.includes(k)))
    : allMetrics;

  const pipeline = [
    buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
    buildFacetStage(facetMetrics),
    { $project: { _id: 0 } }
  ];

  return db.songSwipes.aggregate(pipeline);
};

export default getSongEngagementMetrics; 