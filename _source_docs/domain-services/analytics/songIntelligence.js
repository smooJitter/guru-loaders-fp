import R from 'ramda';
import S from 'sanctuary';
import { ObjectId } from 'mongodb';
import { subHours, parseISO } from 'date-fns';

/**
 * Song Intelligence Service
 * Advanced analytics and decision making for playlist optimization
 */

// Utility functions for aggregation pipelines
const createTimeWindow = R.curry((hours) => ({
  $gte: new Date(Date.now() - hours * 60 * 60 * 1000)
}));

const matchEventSongs = R.curry((eventId, timeWindow) => ({
  $match: {
    eventId: new ObjectId(eventId),
    ...(timeWindow && { timestamp: timeWindow })
  }
}));

/**
 * Get real-time song engagement metrics
 */
export const getSongEngagementMetrics = async (eventId, context) => {
  const pipeline = [
    matchEventSongs(eventId, createTimeWindow(4)), // Last 4 hours
    {
      $facet: {
        // Swipe Analytics
        swipeMetrics: [
          {
            $group: {
              _id: '$songId',
              rightSwipes: {
                $sum: { $cond: [{ $eq: ['$direction', 'right'] }, 1, 0] }
              },
              leftSwipes: {
                $sum: { $cond: [{ $eq: ['$direction', 'left'] }, 1, 0] }
              },
              totalSwipes: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' },
              avgResponseTime: { $avg: '$responseTime' }
            }
          },
          {
            $project: {
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
            }
          }
        ],

        // Credit/Tip Analysis
        creditMetrics: [
          {
            $match: { creditAmount: { $gt: 0 } }
          },
          {
            $group: {
              _id: '$songId',
              totalCredits: { $sum: '$creditAmount' },
              tipCount: { $sum: 1 },
              uniqueTippers: { $addToSet: '$userId' },
              avgTipAmount: { $avg: '$creditAmount' },
              maxTip: { $max: '$creditAmount' }
            }
          },
          {
            $project: {
              songId: '$_id',
              tipperCount: { $size: '$uniqueTippers' },
              avgTipPerUser: {
                $divide: ['$totalCredits', { $size: '$uniqueTippers' }]
              },
              tipFrequency: {
                $divide: ['$tipCount', { $size: '$uniqueTippers' }]
              }
            }
          }
        ],

        // Temporal Patterns
        timePatterns: [
          {
            $group: {
              _id: {
                hour: { $hour: '$timestamp' },
                songId: '$songId'
              },
              engagement: {
                $sum: {
                  $add: [
                    { $cond: [{ $eq: ['$direction', 'right'] }, 2, 0] },
                    { $cond: [{ $gt: ['$creditAmount', 0] }, 3, 0] }
                  ]
                }
              }
            }
          },
          {
            $group: {
              _id: '$_id.songId',
              hourlyPattern: {
                $push: {
                  hour: '$_id.hour',
                  engagement: '$engagement'
                }
              },
              peakHours: {
                $push: {
                  $cond: [
                    { $gt: ['$engagement', 5] },
                    '$_id.hour',
                    null
                  ]
                }
              }
            }
          }
        ],

        // Genre Performance
        genreMetrics: [
          {
            $lookup: {
              from: 'songs',
              localField: 'songId',
              foreignField: '_id',
              as: 'song'
            }
          },
          { $unwind: '$song' },
          {
            $group: {
              _id: '$song.genre',
              totalEngagement: {
                $sum: {
                  $add: [
                    { $cond: [{ $eq: ['$direction', 'right'] }, 2, 0] },
                    { $multiply: ['$creditAmount', 0.5] }
                  ]
                }
              },
              songCount: { $addToSet: '$songId' },
              avgCredits: { $avg: '$creditAmount' }
            }
          },
          {
            $project: {
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
            }
          }
        ]
      }
    }
  ];

  return context.services.db.songSwipes.aggregate(pipeline);
};

/**
 * Get intelligent playlist recommendations
 */
export const getPlaylistRecommendations = async (eventId, context) => {
  const pipeline = [
    {
      $facet: {
        // Current Vibe Analysis
        vibeMetrics: [
          matchEventSongs(eventId, createTimeWindow(1)), // Last hour
          {
            $lookup: {
              from: 'songs',
              localField: 'songId',
              foreignField: '_id',
              as: 'song'
            }
          },
          { $unwind: '$song' },
          {
            $group: {
              _id: null,
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
          }
        ],

        // Song Request Patterns
        requestPatterns: [
          {
            $match: {
              requestType: 'explicit',
              timestamp: createTimeWindow(2) // Last 2 hours
            }
          },
          {
            $group: {
              _id: '$songId',
              requestCount: { $sum: 1 },
              totalCredits: { $sum: '$creditAmount' },
              uniqueRequesters: { $addToSet: '$userId' }
            }
          },
          {
            $sort: {
              totalCredits: -1,
              requestCount: -1
            }
          }
        ],

        // Crowd Energy Mapping
        crowdEnergy: [
          {
            $group: {
              _id: {
                hour: { $hour: '$timestamp' },
                songId: '$songId'
              },
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
          },
          {
            $project: {
              timeBlock: '$_id.hour',
              energyScore: {
                $multiply: [
                  '$engagement',
                  { $divide: [1, { $add: ['$responseTime', 1] }] }
                ]
              }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.songRequests.aggregate(pipeline);
};

/**
 * Get dynamic pricing recommendations
 */
export const getDynamicPricingRecommendations = async (eventId, context) => {
  const pipeline = [
    matchEventSongs(eventId, createTimeWindow(24)), // Last 24 hours
    {
      $facet: {
        // Price Sensitivity Analysis
        priceSensitivity: [
          {
            $group: {
              _id: {
                songId: '$songId',
                pricePoint: {
                  $switch: {
                    branches: [
                      { case: { $lt: ['$creditAmount', 10] }, then: 'low' },
                      { case: { $lt: ['$creditAmount', 50] }, then: 'medium' },
                      { case: { $lt: ['$creditAmount', 100] }, then: 'high' }
                    ],
                    default: 'premium'
                  }
                }
              },
              requestCount: { $sum: 1 },
              conversionRate: {
                $avg: {
                  $cond: [{ $gt: ['$creditAmount', 0] }, 1, 0]
                }
              }
            }
          }
        ],

        // Time-based Pricing
        timeBasedPricing: [
          {
            $group: {
              _id: {
                hour: { $hour: '$timestamp' },
                songId: '$songId'
              },
              avgCredits: { $avg: '$creditAmount' },
              maxCredits: { $max: '$creditAmount' },
              requestCount: { $sum: 1 }
            }
          },
          {
            $project: {
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
            }
          }
        ],

        // Genre-based Pricing
        genrePricing: [
          {
            $lookup: {
              from: 'songs',
              localField: 'songId',
              foreignField: '_id',
              as: 'song'
            }
          },
          { $unwind: '$song' },
          {
            $group: {
              _id: '$song.genre',
              avgCredits: { $avg: '$creditAmount' },
              maxCredits: { $max: '$creditAmount' },
              totalRequests: { $sum: 1 },
              uniqueRequesters: { $addToSet: '$userId' }
            }
          },
          {
            $project: {
              genre: '$_id',
              priceRange: {
                suggested: '$avgCredits',
                ceiling: '$maxCredits'
              },
              demandMetrics: {
                totalRequests: '$totalRequests',
                uniqueRequesters: { $size: '$uniqueRequesters' }
              }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.songRequests.aggregate(pipeline);
};

/**
 * Get song sequence optimization recommendations
 */
export const getSongSequenceOptimization = async (eventId, context) => {
  const pipeline = [
    matchEventSongs(eventId, createTimeWindow(12)), // Last 12 hours
    {
      $facet: {
        // Transition Analysis
        transitionPatterns: [
          {
            $lookup: {
              from: 'songs',
              localField: 'songId',
              foreignField: '_id',
              as: 'song'
            }
          },
          { $unwind: '$song' },
          {
            $group: {
              _id: {
                fromGenre: '$song.genre',
                toGenre: {
                  $arrayElemAt: [
                    '$nextSong.genre',
                    0
                  ]
                }
              },
              successCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$direction', 'right'] },
                        { $gt: ['$creditAmount', 0] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              totalTransitions: { $sum: 1 }
            }
          },
          {
            $project: {
              transition: '$_id',
              successRate: {
                $multiply: [
                  { $divide: ['$successCount', '$totalTransitions'] },
                  100
                ]
              }
            }
          }
        ],

        // Energy Flow Analysis
        energyFlow: [
          {
            $lookup: {
              from: 'songs',
              localField: 'songId',
              foreignField: '_id',
              as: 'song'
            }
          },
          { $unwind: '$song' },
          {
            $group: {
              _id: {
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
              engagement: {
                $avg: {
                  $add: [
                    { $multiply: ['$creditAmount', 0.3] },
                    { $cond: [{ $eq: ['$direction', 'right'] }, 1, 0] }
                  ]
                }
              }
            }
          }
        ],

        // Mood Progression
        moodProgression: [
          {
            $lookup: {
              from: 'songs',
              localField: 'songId',
              foreignField: '_id',
              as: 'song'
            }
          },
          { $unwind: '$song' },
          {
            $group: {
              _id: {
                timeBlock: {
                  $floor: {
                    $divide: [{ $hour: '$timestamp' }, 2]
                  }
                },
                mood: '$song.mood'
              },
              engagement: {
                $avg: {
                  $add: [
                    { $multiply: ['$creditAmount', 0.5] },
                    { $cond: [{ $eq: ['$direction', 'right'] }, 2, 0] }
                  ]
                }
              },
              songCount: { $sum: 1 }
            }
          },
          {
            $project: {
              timeBlock: '$_id.timeBlock',
              mood: '$_id.mood',
              effectiveness: {
                $multiply: [
                  '$engagement',
                  { $divide: ['$songCount', 10] }
                ]
              }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.songPlays.aggregate(pipeline);
}; 