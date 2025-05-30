import { schemaComposer } from 'graphql-compose';
import { InvoiceTC } from '../../models-tc/billing/invoice.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { invoiceService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  invoiceCreateOne: InvoiceTC.mongooseResolvers.createOne(),
  invoiceCreateMany: InvoiceTC.mongooseResolvers.createMany(),
  invoiceUpdateById: InvoiceTC.mongooseResolvers.updateById(),
  invoiceUpdateOne: InvoiceTC.mongooseResolvers.updateOne(),
  invoiceUpdateMany: InvoiceTC.mongooseResolvers.updateMany(),
  invoiceRemoveById: InvoiceTC.mongooseResolvers.removeById(),
  invoiceRemoveOne: InvoiceTC.mongooseResolvers.removeOne(),
  invoiceRemoveMany: InvoiceTC.mongooseResolvers.removeMany(),
};

// Custom resolvers
const customResolvers = {
  generateInvoice: {
    type: InvoiceTC,
    args: {
      customerId: 'MongoID!',
      items: '[JSON!]!',
      dueDate: 'Date',
    },
    resolve: async (_, args, context) => {
      return invoiceService.generateInvoice(args.customerId, args.items, args.dueDate, context);
    },
  },
  markInvoicePaid: {
    type: InvoiceTC,
    args: {
      invoiceId: 'MongoID!',
      paymentDetails: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return invoiceService.markAsPaid(args.invoiceId, args.paymentDetails, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  invoiceCreateOne: defaultResolvers.invoiceCreateOne.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  invoiceUpdateById: defaultResolvers.invoiceUpdateById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  invoiceRemoveById: defaultResolvers.invoiceRemoveById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  generateInvoice: customResolvers.generateInvoice.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole('admin')(rp);
    return next(rp);
  }),
  markInvoicePaid: customResolvers.markInvoicePaid.wrapResolve(next => async (rp) => {
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