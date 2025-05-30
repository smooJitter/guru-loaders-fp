import { schemaComposer } from 'graphql-compose';
import { CreditAccountTC } from '../../models-tc/credits/credit-account.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { creditAccountService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  creditAccountCreateOne: CreditAccountTC.mongooseResolvers.createOne(),
  creditAccountCreateMany: CreditAccountTC.mongooseResolvers.createMany(),
  creditAccountUpdateById: CreditAccountTC.mongooseResolvers.updateById(),
  creditAccountUpdateOne: CreditAccountTC.mongooseResolvers.updateOne(),
  creditAccountUpdateMany: CreditAccountTC.mongooseResolvers.updateMany(),
  creditAccountRemoveById: CreditAccountTC.mongooseResolvers.removeById(),
  creditAccountRemoveOne: CreditAccountTC.mongooseResolvers.removeOne(),
  creditAccountRemoveMany: CreditAccountTC.mongooseResolvers.removeMany(),
};

// Custom resolvers
const customResolvers = {
  addCredits: {
    type: CreditAccountTC,
    args: {
      accountId: 'MongoID!',
      amount: 'Float!',
      reason: 'String!',
    },
    resolve: async (_, args, context) => {
      return creditAccountService.addCredits(args.accountId, args.amount, args.reason, context);
    },
  },
  deductCredits: {
    type: CreditAccountTC,
    args: {
      accountId: 'MongoID!',
      amount: 'Float!',
      reason: 'String!',
    },
    resolve: async (_, args, context) => {
      return creditAccountService.deductCredits(args.accountId, args.amount, args.reason, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  creditAccountCreateOne: defaultResolvers.creditAccountCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  creditAccountUpdateById: defaultResolvers.creditAccountUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  creditAccountRemoveById: defaultResolvers.creditAccountRemoveById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  addCredits: customResolvers.addCredits.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  deductCredits: customResolvers.deductCredits.wrapResolve(next => async (rp) => {
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