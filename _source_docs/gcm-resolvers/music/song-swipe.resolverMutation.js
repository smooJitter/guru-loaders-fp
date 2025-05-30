import { schemaComposer } from 'graphql-compose';
import { SongSwipeTC } from '../../gcm-type-composers/music/song-swipe.modelTC.js';
import { isAuthenticated } from '../../lib/guards.js';
import { songSwipeService } from '../../domain-services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  songSwipeCreateOne: SongSwipeTC.mongooseResolvers.createOne(),
  songSwipeUpdateById: SongSwipeTC.mongooseResolvers.updateById(),
  songSwipeRemoveById: SongSwipeTC.mongooseResolvers.removeById(),
};

// Custom resolvers
const customResolvers = {
  swipeSong: {
    type: SongSwipeTC,
    args: {
      songId: 'MongoID!',
      direction: 'String!',
    },
    resolve: async (_, args, context) => {
      return songSwipeService.swipeSong(args.songId, args.direction, context);
    },
  },
  updateSwipePreferences: {
    type: SongSwipeTC,
    args: {
      id: 'MongoID!',
      preferences: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return songSwipeService.updateSwipePreferences(args.id, args.preferences, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  songSwipeCreateOne: defaultResolvers.songSwipeCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songSwipeUpdateById: defaultResolvers.songSwipeUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  songSwipeRemoveById: defaultResolvers.songSwipeRemoveById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  swipeSong: customResolvers.swipeSong.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  updateSwipePreferences: customResolvers.updateSwipePreferences.wrapResolve(next => async (rp) => {
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