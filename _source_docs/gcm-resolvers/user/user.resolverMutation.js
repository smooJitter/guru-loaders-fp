import { schemaComposer } from 'graphql-compose';
import { UserTC } from '../../models-tc/user/user.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { userService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  userCreateOne: UserTC.mongooseResolvers.createOne(),
  userCreateMany: UserTC.mongooseResolvers.createMany(),
  userUpdateById: UserTC.mongooseResolvers.updateById(),
  userUpdateOne: UserTC.mongooseResolvers.updateOne(),
  userUpdateMany: UserTC.mongooseResolvers.updateMany(),
  userRemoveById: UserTC.mongooseResolvers.removeById(),
  userRemoveOne: UserTC.mongooseResolvers.removeOne(),
  userRemoveMany: UserTC.mongooseResolvers.removeMany(),
};

// Custom resolvers
const customResolvers = {
  updateUserProfile: {
    type: UserTC,
    args: {
      input: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return userService.updateProfile(args.input, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  userCreateOne: defaultResolvers.userCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  userUpdateById: defaultResolvers.userUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  userRemoveById: defaultResolvers.userRemoveById.wrapResolve(next => async (rp) => {
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