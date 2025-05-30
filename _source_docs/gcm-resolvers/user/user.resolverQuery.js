import { schemaComposer } from 'graphql-compose';
import { UserTC } from '../../models-tc/user/user.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { userService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  userById: UserTC.mongooseResolvers.findById(),
  userByIds: UserTC.mongooseResolvers.findByIds(),
  userOne: UserTC.mongooseResolvers.findOne(),
  userMany: UserTC.mongooseResolvers.findMany(),
  userCount: UserTC.mongooseResolvers.count(),
  userConnection: UserTC.mongooseResolvers.connection(),
  userPagination: UserTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  me: {
    type: UserTC,
    resolve: async (_, __, context) => {
      return context.user;
    },
  },
  
  searchUsers: {
    type: [UserTC],
    args: {
      query: 'String!',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return userService.searchUsers(args.query, args.filters, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  userById: defaultResolvers.userById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  userMany: defaultResolvers.userMany.wrapResolve(next => async (rp) => {
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
schemaComposer.Query.addFields(resolvers);

export default resolvers; 