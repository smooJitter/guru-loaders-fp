import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  buildGroupStage,
  buildProjectStage,
  buildLookupStage,
  validateAnalyticsInput,
  buildConditionalSum,
  buildPushArray,
  buildAddToSetArray
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get song sequence optimization recommendations (configurable, optimized).
 * @param {Object} deps - Dependencies: db (service), ObjectId (class)
 * @returns {Function} (eventId, options) => Promise<any>
 * @param {number} [options.hours=12] - Time window in hours (default: 12)
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getSongSequenceOptimization = ({ db, ObjectId }) => async (eventId, { hours = 12, metrics = null } = {}) => {
  validateAnalyticsInput({ requiredFields: ['eventId'] }, { eventId });
  const timeWindow = createFieldTimeWindow({ field: 'timestamp', hours });

  const allMetrics = {
    transitionPatterns: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
      buildLookupStage({
        from: 'songs',
        localField: 'songId',
        foreignField: '_id',
        as: 'song'
      }),
      { $unwind: '$song' },
      buildGroupStage(
        {
          fromGenre: '$song.genre',
          toGenre: { $arrayElemAt: ['$nextSong.genre', 0] }
        },
        {
          successCount: buildConditionalSum([
            {
              $and: [
                { $eq: ['$direction', 'right'] },
                { $gt: ['$creditAmount', 0] }
              ]
            },
            1,
            0
          ]),
          totalTransitions: { $sum: 1 }
        }
      ),
      buildProjectStage({
        transition: '$_id',
        successRate: {
          $multiply: [
            { $divide: ['$successCount', '$totalTransitions'] },
            100
          ]
        }
      })
    ],
    energyFlow: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
      buildLookupStage({
        from: 'songs',
        localField: 'songId',
        foreignField: '_id',
        as: 'song'
      }),
      { $unwind: '$song' },
      buildGroupStage(
        {
          hour: { $hour: '$timestamp' },
          energyLevel: {
            $switch: {
              branches: [
                { case: { $lt: ['$song.energy', 0.3] }, then: 'low' },
                { case: { $lt: ['$song.energy', 0.7] }, then: 'medium' }
              ],
              default: 'high'
            }
          }
        },
        {
          engagement: { $avg: {
            $add: [
              { $multiply: ['$creditAmount', 0.3] },
              { $cond: [{ $eq: ['$direction', 'right'] }, 1, 0] }
            ]
          } }
        }
      )
    ],
    moodProgression: [
      buildMatchStage({ eventId: new ObjectId(eventId), ...timeWindow }),
      buildLookupStage({
        from: 'songs',
        localField: 'songId',
        foreignField: '_id',
        as: 'song'
      }),
      { $unwind: '$song' },
      buildGroupStage(
        {
          timeBlock: {
            $floor: {
              $divide: [{ $hour: '$timestamp' }, 2]
            }
          },
          mood: '$song.mood'
        },
        {
          engagement: { $avg: {
            $add: [
              { $multiply: ['$creditAmount', 0.5] },
              { $cond: [{ $eq: ['$direction', 'right'] }, 2, 0] }
            ]
          } },
          songCount: { $sum: 1 }
        }
      ),
      buildProjectStage({
        timeBlock: '$_id.timeBlock',
        mood: '$_id.mood',
        effectiveness: {
          $multiply: [
            '$engagement',
            { $divide: ['$songCount', 10] }
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

  return db.songPlays.aggregate(pipeline);
};

export default getSongSequenceOptimization; 