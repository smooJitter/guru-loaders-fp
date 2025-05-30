import { schemaComposer } from 'graphql-compose';
import { SongTC } from '../../gcm-type-composers/music/song.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { songService } from '../../domain-services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  songCreateOne: SongTC.mongooseResolvers.createOne(),
  songCreateMany: SongTC.mongooseResolvers.createMany(),
  songUpdateById: SongTC.mongooseResolvers.updateById(),
  songUpdateOne: SongTC.mongooseResolvers.updateOne(),
  songUpdateMany: SongTC.mongooseResolvers.updateMany(),
  songRemoveById: SongTC.mongooseResolvers.removeById(),
  songRemoveOne: SongTC.mongooseResolvers.removeOne(),
  songRemoveMany: SongTC.mongooseResolvers.removeMany(),
};

// Custom resolvers
const customResolvers = {
  updateSongPopularity: {
    type: SongTC,
    args: {
      id: 'MongoID!',
      popularity: 'Float!',
    },
    resolve: async (_, args, context) => {
      return songService.updateSongPopularity(args.id, args.popularity, context);
    },
  },
  incrementPlayCount: {
    type: SongTC,
    args: {
      id: 'MongoID!',
    },
    resolve: async (_, args, context) => {
      return songService.incrementPlayCount(args.id, context);
    },
  },
  updateSongStatus: {
    type: SongTC,
    args: {
      id: 'MongoID!',
      status: 'String!',
    },
    resolve: async (_, args, context) => {
      return songService.updateSongStatus(args.id, args.status, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  songCreateOne: defaultResolvers.songCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songCreateMany: defaultResolvers.songCreateMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songUpdateById: defaultResolvers.songUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songUpdateOne: defaultResolvers.songUpdateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songUpdateMany: defaultResolvers.songUpdateMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songRemoveById: defaultResolvers.songRemoveById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songRemoveOne: defaultResolvers.songRemoveOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  songRemoveMany: defaultResolvers.songRemoveMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  updateSongPopularity: customResolvers.updateSongPopularity.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  updateSongStatus: customResolvers.updateSongStatus.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
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