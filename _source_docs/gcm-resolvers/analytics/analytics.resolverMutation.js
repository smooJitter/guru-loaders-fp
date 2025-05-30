import { schemaComposer } from 'graphql-compose';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import {
  creditAnalytics,
  revenueAnalytics,
  cohortAnalytics,
  subscriptionAnalytics
} from '../../services/analytics';

// Custom resolvers for analytics mutations
const customResolvers = {
  // Credit Analytics
  generateCreditReport: {
    type: 'JSON!',
    args: {
      reportType: 'String!',
      startDate: 'Date!',
      endDate: 'Date!',
      format: 'String', // pdf, csv, json
    },
    resolve: async (_, args, context) => {
      return creditAnalytics.generateReport(args.reportType, args.startDate, args.endDate, args.format, context);
    },
  },

  // Revenue Analytics
  generateRevenueReport: {
    type: 'JSON!',
    args: {
      reportType: 'String!',
      startDate: 'Date!',
      endDate: 'Date!',
      format: 'String', // pdf, csv, json
    },
    resolve: async (_, args, context) => {
      return revenueAnalytics.generateReport(args.reportType, args.startDate, args.endDate, args.format, context);
    },
  },

  // Cohort Analytics
  scheduleCohortAnalysis: {
    type: 'JSON!',
    args: {
      cohortType: 'String!',
      schedule: 'JSON!', // frequency, time, etc.
      notifyEmail: '[String!]',
    },
    resolve: async (_, args, context) => {
      return cohortAnalytics.scheduleAnalysis(args.cohortType, args.schedule, args.notifyEmail, context);
    },
  },

  // Subscription Analytics
  generateSubscriptionReport: {
    type: 'JSON!',
    args: {
      reportType: 'String!',
      startDate: 'Date!',
      endDate: 'Date!',
      format: 'String', // pdf, csv, json
    },
    resolve: async (_, args, context) => {
      return subscriptionAnalytics.generateReport(args.reportType, args.startDate, args.endDate, args.format, context);
    },
  },

  updateAnalyticsSettings: {
    type: 'JSON!',
    args: {
      settings: 'JSON!',
    },
    resolve: async (_, args, context) => {
      // This could update settings across all analytics services
      await Promise.all([
        creditAnalytics.updateSettings(args.settings.credit, context),
        revenueAnalytics.updateSettings(args.settings.revenue, context),
        cohortAnalytics.updateSettings(args.settings.cohort, context),
        subscriptionAnalytics.updateSettings(args.settings.subscription, context),
      ]);
      return { success: true };
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
schemaComposer.Mutation.addFields(resolvers);

export default resolvers; 