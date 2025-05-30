import { HostAnalyticsTC } from '../../gcm-type-composers/host/hostAnalytics.composer';
import { calculateNewAverageRating } from '../../lib/analytics-helpers';
import { isAuthenticated, hasRole } from '../../lib/guards';

// Query resolvers
export const hostAnalyticsQueries = {
  hostAnalytics: HostAnalyticsTC.mongooseResolvers
    .findOne()
    .wrapResolve(isAuthenticated)
    .wrapResolve(hasRole(['HOST', 'ADMIN']))
    .addArgs({
      hostId: 'MongoID!',
    }),

  hostAnalyticsByDate: HostAnalyticsTC.getResolver('analyticsByDateRange')
    .wrapResolve(isAuthenticated)
    .wrapResolve(hasRole(['HOST', 'ADMIN'])),

  hostAnalyticsComparison: {
    type: '[HostAnalytics]',
    args: {
      hostIds: '[MongoID!]!',
      timeframe: {
        type: 'String!',
        description: 'Time period for comparison: WEEK, MONTH, or QUARTER'
      }
    },
    resolve: async (source, args, context) => {
      if (!context.user || !['HOST', 'ADMIN'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      const { hostIds, timeframe } = args;
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate date range based on timeframe
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
          throw new Error('Invalid timeframe. Must be WEEK, MONTH, or QUARTER');
      }

      // Verify host access
      if (context.user.role !== 'ADMIN') {
        if (!hostIds.includes(context.user.hostId)) {
          throw new Error('Access denied to requested host data');
        }
      }

      return context.models.HostAnalytics.find({
        hostId: { $in: hostIds },
        'timeframe.start': { $gte: startDate },
        'timeframe.end': { $lte: endDate }
      }).select(context.user.role === 'ADMIN' ? '+marketing.channels.cost +operations.staffUtilization' : '');
    }
  }
};

// Mutation resolvers
export const hostAnalyticsMutations = {
  updateHostAnalytics: HostAnalyticsTC.mongooseResolvers
    .updateOne()
    .wrapResolve(isAuthenticated)
    .wrapResolve(hasRole(['ADMIN'])),

  addDailyPerformance: {
    type: HostAnalyticsTC,
    args: {
      hostId: 'MongoID!',
      performanceData: 'PerformanceMetricsInput!'
    },
    resolve: async (source, args, context) => {
      if (!context.user || !['HOST', 'ADMIN'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      const { hostId, performanceData } = args;

      // Verify host access
      if (context.user.role === 'HOST' && context.user.hostId !== hostId) {
        throw new Error('Access denied to requested host data');
      }

      try {
        // Calculate new average rating
        const newAvgRating = await calculateNewAverageRating(
          context.models.HostAnalytics,
          hostId, 
          performanceData.avgRating
        );

        // Update analytics with atomic operations
        const result = await context.models.HostAnalytics.findOneAndUpdate(
          { hostId },
          { 
            $push: { 'performance.daily': performanceData },
            $inc: {
              'performance.total.revenue': performanceData.revenue,
              'performance.total.attendeeCount': performanceData.attendeeCount
            },
            $set: {
              'performance.total.avgRating': newAvgRating
            }
          },
          { 
            new: true,
            runValidators: true
          }
        );

        if (!result) {
          throw new Error('Host analytics record not found');
        }

        // Emit analytics update event
        context.pubsub.publish('HOST_ANALYTICS_UPDATED', {
          hostId,
          analytics: result
        });

        return result;

      } catch (error) {
        console.error('Error updating host analytics:', error);
        throw new Error('Failed to update host analytics');
      }
    }
  },

  bulkUpdateHostAnalytics: {
    type: '[HostAnalytics]',
    args: {
      updates: '[HostAnalyticsUpdateInput!]!'
    },
    resolve: async (source, args, context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Unauthorized. Only admins can perform bulk updates.');
      }

      const { updates } = args;
      const results = [];

      // Use transactions for bulk update
      const session = await context.models.HostAnalytics.startSession();
      
      try {
        await session.withTransaction(async () => {
          for (const update of updates) {
            const result = await context.models.HostAnalytics.findOneAndUpdate(
              { hostId: update.hostId },
              update.data,
              { 
                new: true,
                runValidators: true,
                session 
              }
            );
            
            if (result) {
              results.push(result);
              // Emit update event
              context.pubsub.publish('HOST_ANALYTICS_UPDATED', {
                hostId: update.hostId,
                analytics: result
              });
            }
          }
        });

        return results;

      } catch (error) {
        console.error('Error in bulk update:', error);
        throw new Error('Failed to perform bulk update');
      } finally {
        session.endSession();
      }
    }
  }
}; 