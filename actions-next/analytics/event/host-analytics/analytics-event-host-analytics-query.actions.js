import { withNamespace } from '../../../../../src/utils/with-namespace.js';

// --- Analytics Event Host Analytics Queries ---

const getPredictiveHostInsights = async ({ context, hostId }) => {
  const { models, services } = context;
  const EventModel = models.Event;
  const ObjectId = services.ObjectId || (id => id); // fallback if not provided
  // Optionally, wrap with error handling if context provides it
  const withErrorHandling = context.withErrorHandling || (fn => fn);

  return withErrorHandling(async () => {
    const pipeline = [
      { $match: { hostId: new ObjectId(hostId) } },
      {
        $facet: {
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
    const [result] = await EventModel.aggregate(pipeline);
    return result;
  })();
};

export default withNamespace('analyticsEventHostAnalytics', {
  getPredictiveHostInsights
}); 