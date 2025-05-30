import { schemaComposer } from 'graphql-compose';
import { SongRequestTC } from '../../gcm-type-composers/music/song-request.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { songRequestService } from '../../domain-services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  songRequestById: SongRequestTC.mongooseResolvers.findById(),
  songRequestOne: SongRequestTC.mongooseResolvers.findOne(),
  songRequestMany: SongRequestTC.mongooseResolvers.findMany(),
  songRequestCount: SongRequestTC.mongooseResolvers.count(),
  songRequestPagination: SongRequestTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  getRequestQueue: {
    type: [SongRequestTC],
    args: {
      status: 'String',
      limit: 'Int',
      offset: 'Int',
    },
    resolve: async (_, args, context) => {
      return songRequestService.getRequestQueue(args, context);
    },
  },
  getUserRequests: {
    type: [SongRequestTC],
    args: {
      userId: 'MongoID!',
      status: 'String',
      limit: 'Int',
      offset: 'Int',
    },
    resolve: async (_, args, context) => {
      return songRequestService.getUserRequests(args.userId, args, context);
    },
  },
  getRequestAnalytics: {
    type: 'JSON',
    args: {
      startDate: 'Date',
      endDate: 'Date',
    },
    resolve: async (_, args, context) => {
      return songRequestService.getRequestAnalytics(args, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  songRequestById: defaultResolvers.songRequestById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songRequestOne: defaultResolvers.songRequestOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songRequestMany: defaultResolvers.songRequestMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songRequestCount: defaultResolvers.songRequestCount.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songRequestPagination: defaultResolvers.songRequestPagination.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getRequestQueue: customResolvers.getRequestQueue.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('dj')(rp);
    return next(rp);
  }),
  getUserRequests: customResolvers.getUserRequests.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getRequestAnalytics: customResolvers.getRequestAnalytics.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('dj')(rp);
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