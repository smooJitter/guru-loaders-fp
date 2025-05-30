import R from 'ramda';
import S from 'sanctuary';
import { ObjectId } from 'mongodb';
import { subDays, subMonths, parseISO } from 'date-fns';

/**
 * Host Performance Analytics Service
 * Advanced metrics for event hosts using functional composition
 */

// Utility functions for aggregation pipelines
const createDateRange = R.curry((startDate, endDate) => ({
  $gte: new Date(startDate),
  $lte: new Date(endDate)
}));

const matchHostEvents = R.curry((hostId, dateRange) => ({
  $match: {
    hostId: new ObjectId(hostId),
    ...(dateRange && { createdAt: dateRange })
  }
}));

/**
 * Get comprehensive host performance metrics
 */
export const getHostPerformanceMetrics = async (hostId, startDate, endDate, context) => {
  const dateRange = createDateRange(startDate, endDate);
  
  const pipeline = [
    matchHostEvents(hostId, dateRange),
    {
      $facet: {
        // Event Success Metrics
        eventMetrics: [
          {
            $group: {
              _id: '$_id',
              totalAttendees: { $sum: '$attendeeCount' },
              ticketsSold: { $sum: '$ticketsSold' },
              revenue: { $sum: '$totalRevenue' },
              ratings: { $push: '$ratings' },
              completionRate: {
                $avg: {
                  $divide: ['$attendeeCount', '$capacity']
                }
              }
            }
          },
          {
            $addFields: {
              avgRating: { $avg: '$ratings.value' },
              profitMargin: {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$revenue', '$operationalCosts'] },
                      '$revenue'
                    ]
                  },
                  100
                ]
              }
            }
          }
        ],
        
        // Audience Growth Metrics
        audienceGrowth: [
          {
            $lookup: {
              from: 'attendees',
              localField: '_id',
              foreignField: 'eventId',
              as: 'attendees'
            }
          },
          { $unwind: '$attendees' },
          {
            $group: {
              _id: '$attendees.userId',
              eventsAttended: { $sum: 1 },
              totalSpent: { $sum: '$attendees.ticketPrice' },
              firstAttended: { $min: '$startDate' },
              lastAttended: { $max: '$startDate' }
            }
          },
          {
            $facet: {
              loyaltyDistribution: [
                {
                  $bucket: {
                    groupBy: '$eventsAttended',
                    boundaries: [1, 2, 3, 5, 10],
                    default: '10+',
                    output: {
                      count: { $sum: 1 },
                      avgSpend: { $avg: '$totalSpent' }
                    }
                  }
                }
              ],
              retentionRates: [
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: '%Y-%m',
                        date: '$firstAttended'
                      }
                    },
                    returningCount: {
                      $sum: { $cond: [{ $gt: ['$eventsAttended', 1] }, 1, 0] }
                    },
                    totalCount: { $sum: 1 }
                  }
                },
                {
                  $project: {
                    retentionRate: {
                      $multiply: [
                        { $divide: ['$returningCount', '$totalCount'] },
                        100
                      ]
                    }
                  }
                }
              ]
            }
          }
        ],

        // Operational Efficiency Metrics
        operationalMetrics: [
          {
            $group: {
              _id: null,
              avgSetupTime: { $avg: '$setupDuration' },
              avgTeardownTime: { $avg: '$teardownDuration' },
              staffUtilization: {
                $avg: {
                  $divide: ['$actualStaffHours', '$plannedStaffHours']
                }
              },
              equipmentEfficiency: {
                $avg: {
                  $divide: ['$equipmentUsed', '$equipmentAvailable']
                }
              },
              costPerAttendee: {
                $avg: {
                  $divide: ['$operationalCosts', '$attendeeCount']
                }
              }
            }
          }
        ],

        // Marketing Performance
        marketingMetrics: [
          {
            $lookup: {
              from: 'marketingCampaigns',
              localField: '_id',
              foreignField: 'eventId',
              as: 'campaigns'
            }
          },
          { $unwind: '$campaigns' },
          {
            $group: {
              _id: '$campaigns.channel',
              reach: { $sum: '$campaigns.reach' },
              engagement: { $sum: '$campaigns.engagement' },
              conversions: { $sum: '$campaigns.conversions' },
              cost: { $sum: '$campaigns.cost' }
            }
          },
          {
            $project: {
              channel: '$_id',
              roi: {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$conversions', '$cost'] },
                      '$cost'
                    ]
                  },
                  100
                ]
              },
              conversionRate: {
                $multiply: [
                  { $divide: ['$conversions', '$reach'] },
                  100
                ]
              },
              costPerConversion: {
                $divide: ['$cost', '$conversions']
              }
            }
          }
        ],

        // Competitive Analysis
        marketComparison: [
          {
            $lookup: {
              from: 'events',
              let: { eventDate: '$startDate', eventCategory: '$category' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $ne: ['$hostId', '$$hostId'] },
                        { $eq: ['$category', '$$eventCategory'] },
                        {
                          $and: [
                            { $gte: ['$startDate', '$$eventDate'] },
                            { $lte: ['$startDate', { $add: ['$$eventDate', 1000 * 60 * 60 * 24 * 30] }] }
                          ]
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'competingEvents'
            }
          },
          {
            $project: {
              relativePricing: {
                $divide: ['$averageTicketPrice', { $avg: '$competingEvents.averageTicketPrice' }]
              },
              marketShare: {
                $divide: [
                  '$attendeeCount',
                  { $sum: ['$attendeeCount', { $sum: '$competingEvents.attendeeCount' }] }
                ]
              },
              competitorCount: { $size: '$competingEvents' }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.events.aggregate(pipeline);
};

/**
 * Get predictive insights for future events
 */
export const getPredictiveHostInsights = async (hostId, context) => {
  const pipeline = [
    matchHostEvents(hostId),
    {
      $facet: {
        // Demand Forecasting
        demandForecast: [
          {
            $group: {
              _id: {
                month: { $month: '$startDate' },
                dayOfWeek: { $dayOfWeek: '$startDate' },
                timeOfDay: {
                  $floor: {
                    $divide: [{ $hour: '$startDate' }, 4]
                  }
                }
              },
              avgAttendance: { $avg: '$attendeeCount' },
              avgTicketPrice: { $avg: '$averageTicketPrice' },
              historicalDemand: {
                $push: {
                  date: '$startDate',
                  attendance: '$attendeeCount'
                }
              }
            }
          },
          {
            $project: {
              seasonalityFactor: {
                $divide: ['$avgAttendance', { $avg: '$historicalDemand.attendance' }]
              },
              priceElasticity: {
                $divide: [
                  { $subtract: [1, { $divide: ['$avgAttendance', { $avg: '$historicalDemand.attendance' }] }] },
                  { $subtract: [1, { $divide: ['$avgTicketPrice', { $avg: '$historicalDemand.ticketPrice' }] }] }
                ]
              }
            }
          }
        ],

        // Optimal Pricing Strategy
        pricingStrategy: [
          {
            $group: {
              _id: {
                priceRange: {
                  $switch: {
                    branches: [
                      { case: { $lt: ['$averageTicketPrice', 50] }, then: '0-50' },
                      { case: { $lt: ['$averageTicketPrice', 100] }, then: '50-100' },
                      { case: { $lt: ['$averageTicketPrice', 200] }, then: '100-200' }
                    ],
                    default: '200+'
                  }
                }
              },
              avgOccupancy: { $avg: { $divide: ['$attendeeCount', '$capacity'] } },
              avgRevenue: { $avg: '$totalRevenue' },
              profitMargin: {
                $avg: {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ['$totalRevenue', '$operationalCosts'] },
                        '$totalRevenue'
                      ]
                    },
                    100
                  ]
                }
              }
            }
          }
        ],

        // Resource Optimization
        resourceOptimization: [
          {
            $group: {
              _id: {
                eventSize: {
                  $switch: {
                    branches: [
                      { case: { $lt: ['$capacity', 100] }, then: 'small' },
                      { case: { $lt: ['$capacity', 500] }, then: 'medium' },
                      { case: { $lt: ['$capacity', 1000] }, then: 'large' }
                    ],
                    default: 'mega'
                  }
                }
              },
              optimalStaffRatio: { $avg: { $divide: ['$actualStaffHours', '$attendeeCount'] } },
              optimalEquipmentRatio: { $avg: { $divide: ['$equipmentUsed', '$attendeeCount'] } },
              setupTimePerCapacity: { $avg: { $divide: ['$setupDuration', '$capacity'] } }
            }
          }
        ],

        // Risk Assessment
        riskMetrics: [
          {
            $group: {
              _id: null,
              weatherImpact: {
                $avg: {
                  $cond: [
                    { $eq: ['$weatherCondition', 'adverse'] },
                    { $divide: ['$attendeeCount', '$expectedAttendees'] },
                    1
                  ]
                }
              },
              seasonalVolatility: { $stdDevPop: '$attendeeCount' },
              cancellationRate: {
                $avg: {
                  $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
                }
              }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.events.aggregate(pipeline);
};

/**
 * Get real-time event monitoring metrics
 */
export const getRealTimeHostMetrics = async (hostId, eventId, context) => {
  const pipeline = [
    {
      $match: {
        hostId: new ObjectId(hostId),
        eventId: new ObjectId(eventId),
        timestamp: {
          $gte: new Date(Date.now() - 1000 * 60 * 60) // Last hour
        }
      }
    },
    {
      $facet: {
        // Real-time Attendance Flow
        attendanceFlow: [
          {
            $group: {
              _id: {
                minute: {
                  $dateToString: {
                    format: '%Y-%m-%d %H:%M',
                    date: '$timestamp'
                  }
                }
              },
              entries: { $sum: '$isEntry' },
              exits: { $sum: { $cond: ['$isEntry', 0, 1] } }
            }
          },
          {
            $project: {
              timestamp: '$_id.minute',
              netFlow: { $subtract: ['$entries', '$exits'] },
              totalFlow: { $add: ['$entries', '$exits'] }
            }
          }
        ],

        // Zone Occupancy
        zoneMetrics: [
          {
            $group: {
              _id: '$zone',
              currentOccupancy: { $sum: 1 },
              peakOccupancy: { $max: '$zoneOccupancy' },
              avgDuration: { $avg: '$zoneDuration' }
            }
          },
          {
            $project: {
              zone: '$_id',
              utilizationRate: {
                $multiply: [
                  { $divide: ['$currentOccupancy', '$peakOccupancy'] },
                  100
                ]
              }
            }
          }
        ],

        // Service Performance
        serviceMetrics: [
          {
            $group: {
              _id: '$serviceType',
              avgWaitTime: { $avg: '$waitTime' },
              serviceRate: { $avg: '$serviceTime' },
              queueLength: { $avg: '$queueLength' }
            }
          },
          {
            $project: {
              serviceType: '$_id',
              efficiency: {
                $multiply: [
                  {
                    $divide: ['$serviceRate', { $add: ['$avgWaitTime', '$serviceRate'] }]
                  },
                  100
                ]
              }
            }
          }
        ],

        // Safety and Security
        securityMetrics: [
          {
            $group: {
              _id: null,
              incidentCount: {
                $sum: {
                  $cond: [{ $eq: ['$type', 'security_incident'] }, 1, 0]
                }
              },
              crowdDensity: { $avg: '$crowdDensity' },
              securityAlerts: {
                $push: {
                  $cond: [
                    { $eq: ['$type', 'security_alert'] },
                    {
                      timestamp: '$timestamp',
                      severity: '$severity',
                      location: '$zone'
                    },
                    null
                  ]
                }
              }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.eventMonitoring.aggregate(pipeline);
};

/**
 * Get audience engagement metrics
 */
export const getAudienceEngagementMetrics = async (hostId, eventId, context) => {
  const pipeline = [
    {
      $match: {
        hostId: new ObjectId(hostId),
        eventId: new ObjectId(eventId)
      }
    },
    {
      $facet: {
        // Social Media Engagement
        socialMetrics: [
          {
            $lookup: {
              from: 'socialPosts',
              localField: 'eventId',
              foreignField: 'eventId',
              as: 'posts'
            }
          },
          {
            $unwind: '$posts'
          },
          {
            $group: {
              _id: '$posts.platform',
              postCount: { $sum: 1 },
              totalEngagement: {
                $sum: {
                  $add: [
                    '$posts.likes',
                    '$posts.shares',
                    '$posts.comments'
                  ]
                }
              },
              reach: { $sum: '$posts.reach' },
              sentiment: { $avg: '$posts.sentimentScore' }
            }
          }
        ],

        // Interactive Features Usage
        interactionMetrics: [
          {
            $group: {
              _id: '$featureType',
              usageCount: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' },
              avgDuration: { $avg: '$duration' },
              peakUsage: {
                $max: {
                  $size: '$activeUsers'
                }
              }
            }
          }
        ],

        // Audience Feedback
        feedbackMetrics: [
          {
            $group: {
              _id: '$feedbackCategory',
              averageRating: { $avg: '$rating' },
              sentimentScore: { $avg: '$sentimentScore' },
              responseCount: { $sum: 1 },
              keyTopics: {
                $addToSet: '$topics'
              }
            }
          }
        ],

        // Engagement Patterns
        engagementPatterns: [
          {
            $group: {
              _id: {
                hour: { $hour: '$timestamp' },
                type: '$engagementType'
              },
              count: { $sum: 1 },
              intensity: { $avg: '$engagementIntensity' }
            }
          },
          {
            $group: {
              _id: '$_id.type',
              hourlyPattern: {
                $push: {
                  hour: '$_id.hour',
                  count: '$count',
                  intensity: '$intensity'
                }
              }
            }
          }
        ]
      }
    }
  ];

  return context.services.db.eventEngagement.aggregate(pipeline);
}; 