import { schemaComposer } from 'graphql-compose';
import { SongTC } from '../../gcm-type-composers/music/song.modelTC.js';
import { isAuthenticated } from '../../lib/guards.js';
import { songService } from '../../domain-services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  songById: SongTC.mongooseResolvers.findById(),
  songByIds: SongTC.mongooseResolvers.findByIds(),
  songOne: SongTC.mongooseResolvers.findOne(),
  songMany: SongTC.mongooseResolvers.findMany(),
  songCount: SongTC.mongooseResolvers.count(),
  songConnection: SongTC.mongooseResolvers.connection(),
  songPagination: SongTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  getTopSongs: {
    type: [SongTC],
    args: {
      limit: 'Int',
      genre: 'String',
    },
    resolve: async (_, args, context) => {
      return songService.getTopSongs(args, context);
    },
  },
  getTrendingSongs: {
    type: [SongTC],
    args: {
      timeWindow: 'String',
      limit: 'Int',
    },
    resolve: async (_, args, context) => {
      return songService.getTrendingSongs(args, context);
    },
  },
  getSongAnalytics: {
    type: 'JSON',
    args: {
      id: 'MongoID!',
      startDate: 'Date',
      endDate: 'Date',
    },
    resolve: async (_, args, context) => {
      return songService.getSongAnalytics(args.id, args, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  songById: defaultResolvers.songById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songByIds: defaultResolvers.songByIds.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songOne: defaultResolvers.songOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songMany: defaultResolvers.songMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songCount: defaultResolvers.songCount.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songConnection: defaultResolvers.songConnection.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songPagination: defaultResolvers.songPagination.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getTopSongs: customResolvers.getTopSongs.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getTrendingSongs: customResolvers.getTrendingSongs.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  getSongAnalytics: customResolvers.getSongAnalytics.wrapResolve(next => async (rp) => {
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