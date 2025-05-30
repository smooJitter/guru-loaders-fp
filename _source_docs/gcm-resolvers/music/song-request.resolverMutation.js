import { schemaComposer } from 'graphql-compose';
import { SongRequestTC } from '../../gcm-type-composers/music/song-request.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { songRequestService } from '../../domain-services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  songRequestCreateOne: SongRequestTC.mongooseResolvers.createOne(),
  songRequestUpdateById: SongRequestTC.mongooseResolvers.updateById(),
  songRequestRemoveById: SongRequestTC.mongooseResolvers.removeById(),
};

// Custom resolvers
const customResolvers = {
  createSongRequest: {
    type: SongRequestTC,
    args: {
      songId: 'MongoID!',
      message: 'String',
      priority: 'Int',
    },
    resolve: async (_, args, context) => {
      return songRequestService.createSongRequest(args, context);
    },
  },
  updateRequestStatus: {
    type: SongRequestTC,
    args: {
      id: 'MongoID!',
      status: 'String!',
      djMessage: 'String',
    },
    resolve: async (_, args, context) => {
      return songRequestService.updateRequestStatus(args.id, args.status, args.djMessage, context);
    },
  },
  cancelRequest: {
    type: SongRequestTC,
    args: {
      id: 'MongoID!',
      reason: 'String',
    },
    resolve: async (_, args, context) => {
      return songRequestService.cancelRequest(args.id, args.reason, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  songRequestCreateOne: defaultResolvers.songRequestCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songRequestUpdateById: defaultResolvers.songRequestUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('dj')(rp);
    return next(rp);
  }),
  songRequestRemoveById: defaultResolvers.songRequestRemoveById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('dj')(rp);
    return next(rp);
  }),
  createSongRequest: customResolvers.createSongRequest.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  updateRequestStatus: customResolvers.updateRequestStatus.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('dj')(rp);
    return next(rp);
  }),
  cancelRequest: customResolvers.cancelRequest.wrapResolve(next => async (rp) => {
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
schemaComposer.Mutation.addFields(resolvers);

export default resolvers; 