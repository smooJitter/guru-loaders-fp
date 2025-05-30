import { schemaComposer } from 'graphql-compose';
import { CustomerTC } from '../../models-tc/billing/customer.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { customerService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  customerCreateOne: CustomerTC.mongooseResolvers.createOne(),
  customerCreateMany: CustomerTC.mongooseResolvers.createMany(),
  customerUpdateById: CustomerTC.mongooseResolvers.updateById(),
  customerUpdateOne: CustomerTC.mongooseResolvers.updateOne(),
  customerUpdateMany: CustomerTC.mongooseResolvers.updateMany(),
  customerRemoveById: CustomerTC.mongooseResolvers.removeById(),
  customerRemoveOne: CustomerTC.mongooseResolvers.removeOne(),
  customerRemoveMany: CustomerTC.mongooseResolvers.removeMany(),
};

// Custom resolvers
const customResolvers = {
  updateCustomerProfile: {
    type: CustomerTC,
    args: {
      customerId: 'MongoID!',
      input: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return customerService.updateProfile(args.customerId, args.input, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  customerCreateOne: defaultResolvers.customerCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  customerUpdateById: defaultResolvers.customerUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  customerRemoveById: defaultResolvers.customerRemoveById.wrapResolve(next => async (rp) => {
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