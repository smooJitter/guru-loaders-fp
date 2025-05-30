import { schemaComposer } from 'graphql-compose';
import { InvoiceTC } from '../../models-tc/billing/invoice.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { invoiceService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  invoiceById: InvoiceTC.mongooseResolvers.findById(),
  invoiceByIds: InvoiceTC.mongooseResolvers.findByIds(),
  invoiceOne: InvoiceTC.mongooseResolvers.findOne(),
  invoiceMany: InvoiceTC.mongooseResolvers.findMany(),
  invoiceCount: InvoiceTC.mongooseResolvers.count(),
  invoiceConnection: InvoiceTC.mongooseResolvers.connection(),
  invoicePagination: InvoiceTC.mongooseResolvers.pagination(),
};

// Custom resolvers
const customResolvers = {
  getCustomerInvoices: {
    type: [InvoiceTC],
    args: {
      customerId: 'MongoID!',
      status: 'String',
      dateRange: 'JSON',
    },
    resolve: async (_, args, context) => {
      return invoiceService.getCustomerInvoices(args.customerId, args.status, args.dateRange, context);
    },
  },
};

// Apply guards to resolvers that need them
const protectedResolvers = {
  invoiceById: defaultResolvers.invoiceById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),
  invoiceMany: defaultResolvers.invoiceMany.wrapResolve(next => async (rp) => {
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