import { Schema } from 'mongoose';
import { schemaComposer } from 'graphql-compose';
import { composeMongoose, convertSchemaToGraphQL } from 'graphql-compose-mongoose';

// First convert embedded types
convertSchemaToGraphQL(
  new Schema({
    date: { type: Date, required: true },
    revenue: { type: Number, required: true },
    attendeeCount: { type: Number, required: true },
    avgRating: { type: Number, min: 0, max: 5 }
  }, { _id: false }),
  'PerformanceMetrics',
  schemaComposer
);

convertSchemaToGraphQL(
  new Schema({
    totalAttendees: { type: Number, required: true },
    newAttendees: { type: Number, required: true },
    returningAttendees: { type: Number, required: true },
    retentionRate: { type: Number, required: true },
    loyaltyScore: { type: Number, required: true }
  }, { _id: false }),
  'AudienceGrowth',
  schemaComposer
);

convertSchemaToGraphQL(
  new Schema({
    channel: { type: String, required: true },
    clicks: { type: Number, required: true },
    conversions: { type: Number, required: true },
    cost: { type: Number, required: true },
    roi: { type: Number, required: true }
  }, { _id: false }),
  'MarketingChannel',
  schemaComposer
);

// Main Host Analytics Schema
const HostAnalytics = mongoose.model('HostAnalytics', new Schema({
  hostId: { type: Schema.Types.ObjectId, ref: 'Host', required: true },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
  timeframe: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  performance: {
    daily: [{
      _id: false,
      date: { type: Date, required: true },
      revenue: { type: Number, required: true },
      attendeeCount: { type: Number, required: true },
      avgRating: { type: Number, min: 0, max: 5 }
    }],
    total: {
      revenue: { type: Number, required: true },
      attendeeCount: { type: Number, required: true },
      avgRating: { type: Number, min: 0, max: 5 }
    }
  },
  audience: {
    growth: {
      totalAttendees: { type: Number, required: true },
      newAttendees: { type: Number, required: true },
      returningAttendees: { type: Number, required: true },
      retentionRate: { type: Number, required: true },
      loyaltyScore: { type: Number, required: true }
    },
    demographics: {
      ageGroups: [{
        _id: false,
        range: { type: String, required: true },
        percentage: { type: Number, required: true }
      }],
      topZipCodes: [{
        _id: false,
        zipCode: { type: String, required: true },
        attendeeCount: { type: Number, required: true }
      }]
    }
  },
  operations: {
    staffUtilization: { type: Number, required: true },
    peakHours: [{
      _id: false,
      hour: { type: Number, required: true },
      attendeeCount: { type: Number, required: true }
    }],
    inventoryTurnover: { type: Number, required: true },
    avgServiceTime: { type: Number, required: true }
  },
  marketing: {
    channels: [{
      _id: false,
      channel: { type: String, required: true },
      clicks: { type: Number, required: true },
      conversions: { type: Number, required: true },
      cost: { type: Number, required: true },
      roi: { type: Number, required: true }
    }],
    campaignEffectiveness: {
      emailOpen: { type: Number, required: true },
      socialEngagement: { type: Number, required: true },
      referralRate: { type: Number, required: true }
    }
  },
  predictive: {
    nextWeekAttendance: { type: Number, required: true },
    revenueProjection: { type: Number, required: true },
    trendingEvents: [{
      _id: false,
      eventType: { type: String, required: true },
      projectedAttendance: { type: Number, required: true },
      confidence: { type: Number, required: true }
    }]
  }
}));

// Create TypeComposer with customization options
const HostAnalyticsTC = composeMongoose(HostAnalytics, {
  name: 'HostAnalytics',
  fields: {
    remove: ['__v'],
  },
});

// Add relations
HostAnalyticsTC.addRelation('host', {
  resolver: () => HostTC.getResolver('findById'),
  prepareArgs: {
    _id: (source) => source.hostId,
  },
  projection: { hostId: true },
});

HostAnalyticsTC.addRelation('venue', {
  resolver: () => VenueTC.getResolver('findById'),
  prepareArgs: {
    _id: (source) => source.venueId,
  },
  projection: { venueId: true },
});

// Add custom resolvers
HostAnalyticsTC.addResolver({
  name: 'analyticsByDateRange',
  type: HostAnalyticsTC,
  args: {
    hostId: 'MongoID!',
    startDate: 'Date!',
    endDate: 'Date!',
  },
  resolve: async ({ source, args, context }) => {
    const { hostId, startDate, endDate } = args;
    return HostAnalytics.findOne({
      hostId,
      'timeframe.start': { $lte: new Date(startDate) },
      'timeframe.end': { $gte: new Date(endDate) }
    });
  }
});

// Add field resolvers for computed values
HostAnalyticsTC.addFields({
  averageRevenuePerAttendee: {
    type: 'Float',
    resolve: (source) => {
      const { revenue, attendeeCount } = source.performance.total;
      return attendeeCount ? revenue / attendeeCount : 0;
    },
  },
  marketingROI: {
    type: 'Float',
    resolve: (source) => {
      const totalCost = source.marketing.channels.reduce((sum, ch) => sum + ch.cost, 0);
      const totalRevenue = source.performance.total.revenue;
      return totalCost ? (totalRevenue - totalCost) / totalCost * 100 : 0;
    },
  }
});

// Add access control wrapper
function restrictToRoles(roles) {
  return (resolver) => {
    return resolver.wrapResolve((next) => async (rp) => {
      const { role } = rp.context;
      if (!roles.includes(role)) {
        throw new Error('Access denied');
      }

      // Add beforeQuery hook for field-level access control
      rp.beforeQuery = (query) => {
        if (role !== 'ADMIN') {
          // Restrict sensitive fields for non-admin users
          query.select('-marketing.channels.cost -operations.staffUtilization');
        }
      };

      return next(rp);
    });
  };
}

// Add to schema composer
schemaComposer.Query.addFields({
  hostAnalytics: HostAnalyticsTC.mongooseResolvers
    .findOne()
    .wrapResolve(restrictToRoles(['HOST', 'ADMIN']))
    .addArgs({
      hostId: 'MongoID!',
    }),

  hostAnalyticsByDate: HostAnalyticsTC.getResolver('analyticsByDateRange')
    .wrapResolve(restrictToRoles(['HOST', 'ADMIN'])),

  hostAnalyticsComparison: {
    type: '[HostAnalytics]',
    args: {
      hostIds: '[MongoID!]!',
      timeframe: 'String!',
    },
    resolve: async (source, args, context) => {
      const { hostIds, timeframe } = args;
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'WEEK':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'MONTH':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'QUARTER':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        default:
          throw new Error('Invalid timeframe');
      }

      return HostAnalytics.find({
        hostId: { $in: hostIds },
        'timeframe.start': { $gte: startDate },
        'timeframe.end': { $lte: endDate }
      });
    }
  }
});

// Add mutations
schemaComposer.Mutation.addFields({
  updateHostAnalytics: HostAnalyticsTC.mongooseResolvers
    .updateOne()
    .wrapResolve(restrictToRoles(['ADMIN'])),

  addDailyPerformance: {
    type: HostAnalyticsTC,
    args: {
      hostId: 'MongoID!',
      performanceData: 'PerformanceMetricsInput!',
    },
    resolve: async (source, args, context) => {
      const { hostId, performanceData } = args;
      
      const result = await HostAnalytics.findOneAndUpdate(
        { hostId },
        { 
          $push: { 'performance.daily': performanceData },
          $inc: {
            'performance.total.revenue': performanceData.revenue,
            'performance.total.attendeeCount': performanceData.attendeeCount
          },
          $set: {
            'performance.total.avgRating': await calculateNewAverageRating(hostId, performanceData.avgRating)
          }
        },
        { new: true }
      );
      
      return result;
    }
  }
}); 