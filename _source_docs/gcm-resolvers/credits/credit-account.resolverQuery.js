import { schemaComposer } from 'graphql-compose';
import { CreditAccountTC } from '../../models-tc/credits/credit-account.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { creditAccountService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  creditAccountById: CreditAccountTC.mongooseResolvers.findById(),
  creditAccountByIds: CreditAccountTC.mongooseResolvers.findByIds(),
  creditAccountOne: CreditAccountTC.mongooseResolvers.findOne(),
  creditAccountMany: CreditAccountTC.mongooseResolvers.findMany(),
  creditAccountCount: CreditAccountTC.mongooseResolvers.count(),
  creditAccountConnection: CreditAccountTC.mongooseResolvers.connection(),
  creditAccountPagination: CreditAccountTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  getCustomerCreditAccount: {
    type: CreditAccountTC,
    args: {
      customerId: 'MongoID!',
    },
    resolve: async (_, args, context) => {
      return creditAccountService.getCustomerAccount(args.customerId, context);
    },
  },
  getCreditBalance: {
    type: 'Float!',
    args: {
      accountId: 'MongoID!',
    },
    resolve: async (_, args, context) => {
      return creditAccountService.getBalance(args.accountId, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  creditAccountById: defaultResolvers.creditAccountById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  creditAccountMany: defaultResolvers.creditAccountMany.wrapResolve(next => async (rp) => {
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