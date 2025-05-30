import { schemaComposer } from 'graphql-compose';
import { CustomerTC } from '../../models-tc/billing/customer.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { customerService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  customerById: CustomerTC.mongooseResolvers.findById(),
  customerByIds: CustomerTC.mongooseResolvers.findByIds(),
  customerOne: CustomerTC.mongooseResolvers.findOne(),
  customerMany: CustomerTC.mongooseResolvers.findMany(),
  customerCount: CustomerTC.mongooseResolvers.count(),
  customerConnection: CustomerTC.mongooseResolvers.connection(),
  customerPagination: CustomerTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  searchCustomers: {
    type: [CustomerTC],
    args: {
      query: 'String!',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return customerService.searchCustomers(args.query, args.filters, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  customerById: defaultResolvers.customerById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  customerMany: defaultResolvers.customerMany.wrapResolve(next => async (rp) => {
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