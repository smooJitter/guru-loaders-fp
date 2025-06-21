import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  buildGroupStage,
  buildProjectStage,
  buildLookupStage,
  buildSortStage,
  buildConditionalSum,
  buildPushArray,
  buildAddToSetArray,
  validateAnalyticsInput
} from '../../../../actions/utils/analytics/shared-utils.js';
import { withNamespace } from '../../../../src/utils/with-namespace.js';

// --- Analytics Event Song Intel Queries ---

const getSongEngagementMetrics = async ({ context, eventId, hours = 4, metrics = null }) => {
  const { services } = context;
  const { db, ObjectId } = services;
  validateAnalyticsInput({ requiredFields: ['eventId'] }, { eventId });
  const timeWindow = createFieldTimeWindow({ field: 'timestamp', hours });
  // ...metrics logic as in original
  // For brevity, we call the original report function here, but in a real migration, inline or import the logic as above.
  // See actions/analytics/event_song-analytics-intel/reports/get-song-engagement-metrics.js for full details.
  // For now, assume db.songSwipes.aggregate is available.
  // (If not, adapt to your db structure.)
  // The same applies to the other report functions below.
  // ---
  // (Full logic can be inlined here if required by standards.)
  // ---
  // For now, call the original logic:
  // return getSongEngagementMetrics({ db, ObjectId })(eventId, { hours, metrics });
  // ---
  // But for compliance, we inline the pipeline construction:
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

const getPlaylistRecommendations = async ({ context, eventId, hours = 1, requestHours = 2, metrics = null }) => {
  const { services } = context;
  const { db, ObjectId } = services;
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

const getDynamicPricingRecommendations = async ({ context, eventId, hours = 24, metrics = null }) => {
  const { services } = context;
  const { db, ObjectId } = services;
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

const getSongSequenceOptimization = async ({ context, eventId, hours = 12, metrics = null }) => {
  const { services } = context;
  const { db, ObjectId } = services;
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

export default withNamespace('analyticsEventSongIntel', {
  getSongEngagementMetrics,
  getPlaylistRecommendations,
  getDynamicPricingRecommendations,
  getSongSequenceOptimization
});
