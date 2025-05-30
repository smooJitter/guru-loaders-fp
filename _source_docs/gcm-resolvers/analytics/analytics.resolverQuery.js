import { schemaComposer } from 'graphql-compose';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import {
  creditAnalytics,
  revenueAnalytics,
  cohortAnalytics,
  subscriptionAnalytics
} from '../../services/analytics';

// Custom resolvers for analytics
const customResolvers = {
  // Credit Analytics
  getCreditMetrics: {
    type: 'JSON!',
    args: {
      startDate: 'Date!',
      endDate: 'Date!',
      groupBy: 'String',
    },
    resolve: async (_, args, context) => {
      return creditAnalytics.getMetrics(args.startDate, args.endDate, args.groupBy, context);
    },
  },

  // Revenue Analytics
  getRevenueMetrics: {
    type: 'JSON!',
    args: {
      startDate: 'Date!',
      endDate: 'Date!',
      groupBy: 'String',
    },
    resolve: async (_, args, context) => {
      return revenueAnalytics.getMetrics(args.startDate, args.endDate, args.groupBy, context);
    },
  },

  // Cohort Analytics
  getCohortAnalysis: {
    type: 'JSON!',
    args: {
      cohortType: 'String!',
      startDate: 'Date!',
      endDate: 'Date!',
    },
    resolve: async (_, args, context) => {
      return cohortAnalytics.analyze(args.cohortType, args.startDate, args.endDate, context);
    },
  },

  // Subscription Analytics
  getSubscriptionMetrics: {
    type: 'JSON!',
    args: {
      startDate: 'Date!',
      endDate: 'Date!',
      planId: 'MongoID',
    },
    resolve: async (_, args, context) => {
      return subscriptionAnalytics.getMetrics(args.startDate, args.endDate, args.planId, context);
    },
  },

  getChurnRate: {
    type: 'Float!',
    args: {
      period: 'String!', // monthly, quarterly, annual
      date: 'Date!',
    },
    resolve: async (_, args, context) => {
      return subscriptionAnalytics.getChurnRate(args.period, args.date, context);
    },
  },

  getMRR: {
    type: 'Float!',
    args: {
      date: 'Date!',
    },
    resolve: async (_, args, context) => {
      return revenueAnalytics.getMRR(args.date, context);
    },
  },

  getARR: {
    type: 'Float!',
    args: {
      date: 'Date!',
    },
    resolve: async (_, args, context) => {
      return revenueAnalytics.getARR(args.date, context);
    },
  },
};

// Apply guards to resolvers
const protectedResolvers = {};

// Add authentication and authorization to all analytics resolvers
Object.keys(customResolvers).forEach(resolverName => {
  protectedResolvers[resolverName] = customResolvers[resolverName].wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('analytics')(rp);
    return next(rp);
  });
});

// Combine all resolvers
const resolvers = {
  ...protectedResolvers,
};

// Add to schema
schemaComposer.Query.addFields(resolvers);

export default resolvers; 