import { schemaComposer } from 'graphql-compose';
import { SongSwipeTC } from '../../gcm-type-composers/music/song-swipe.modelTC.js';
import { isAuthenticated } from '../../lib/guards.js';
import { songSwipeService } from '../../domain-services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  songSwipeById: SongSwipeTC.mongooseResolvers.findById(),
  songSwipeOne: SongSwipeTC.mongooseResolvers.findOne(),
  songSwipeMany: SongSwipeTC.mongooseResolvers.findMany(),
  songSwipeCount: SongSwipeTC.mongooseResolvers.count(),
  songSwipePagination: SongSwipeTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  getUserSwipeHistory: {
    type: [SongSwipeTC],
    args: {
      userId: 'MongoID!',
      limit: 'Int',
      offset: 'Int',
    },
    resolve: async (_, args, context) => {
      return songSwipeService.getUserSwipeHistory(args.userId, args, context);
    },
  },
  getSwipeAnalytics: {
    type: 'JSON',
    args: {
      userId: 'MongoID!',
      startDate: 'Date',
      endDate: 'Date',
    },
    resolve: async (_, args, context) => {
      return songSwipeService.getSwipeAnalytics(args.userId, args, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  songSwipeById: defaultResolvers.songSwipeById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songSwipeOne: defaultResolvers.songSwipeOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songSwipeMany: defaultResolvers.songSwipeMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songSwipeCount: defaultResolvers.songSwipeCount.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songSwipePagination: defaultResolvers.songSwipePagination.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getUserSwipeHistory: customResolvers.getUserSwipeHistory.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getSwipeAnalytics: customResolvers.getSwipeAnalytics.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
};

// Combine all resolvers
const resolvers = {
  ...defaultResolvers,
  ...customResolvers,
  ...protectedResolvers,
};

// Add to schema
schemaComposer.Query.addFields(resolvers);

export default resolvers; 