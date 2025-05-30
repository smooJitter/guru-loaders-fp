import { schemaComposer } from 'graphql-compose';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import * as hostAnalytics from '../../domain-services/analytics/hostAnalytics';

// Custom resolvers for host analytics
const hostAnalyticsResolvers = {
  // Comprehensive Performance Metrics
  getHostPerformanceMetrics: {
    type: 'JSON!',
    args: {
      hostId: 'String!',
      startDate: 'Date!',
      endDate: 'Date!'
    },
    resolve: async (_, args, context) => {
      return hostAnalytics.getHostPerformanceMetrics(
        args.hostId,
        args.startDate,
        args.endDate,
        context
      );
    }
  },

  // Predictive Insights
  getPredictiveHostInsights: {
    type: 'JSON!',
    args: {
      hostId: 'String!'
    },
    resolve: async (_, args, context) => {
      return hostAnalytics.getPredictiveHostInsights(args.hostId, context);
    }
  },

  // Real-time Event Monitoring
  getRealTimeHostMetrics: {
    type: 'JSON!',
    args: {
      hostId: 'String!',
      eventId: 'String!'
    },
    resolve: async (_, args, context) => {
      return hostAnalytics.getRealTimeHostMetrics(
        args.hostId,
        args.eventId,
        context
      );
    }
  },

  // Audience Engagement Analysis
  getAudienceEngagementMetrics: {
    type: 'JSON!',
    args: {
      hostId: 'String!',
      eventId: 'String!'
    },
    resolve: async (_, args, context) => {
      return hostAnalytics.getAudienceEngagementMetrics(
        args.hostId,
        args.eventId,
        context
      );
    }
  }
};

// Apply authentication and authorization guards
const protectedResolvers = {};

Object.keys(hostAnalyticsResolvers).forEach(resolverName => {
  protectedResolvers[resolverName] = hostAnalyticsResolvers[resolverName].wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['host', 'admin'])(rp);
    return next(rp);
  });
});

export default protectedResolvers; 