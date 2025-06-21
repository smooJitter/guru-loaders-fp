// billing-stripe-query.actions.js
// Placeholder for billing stripe query actions (to be migrated)

import * as R from 'ramda';
import { withNamespace } from '../../../../src/utils/with-namespace.js';

// Local helpers (inlined for modularity)
const sanitizeInvoice = R.omit(['__v']);
const sanitizeCustomer = R.omit(['__v']);

const getOrCreateCustomer = async ({ context, userId, email }) => {
  const { services, models } = context;
  let customer = await models.Customer.findOne({ userId });
  if (!customer) {
    const stripeCustomer = await services.stripe.customers.create({ email });
    customer = await models.Customer.create({ userId, email, stripeCustomerId: stripeCustomer.id });
  }
  return sanitizeCustomer(customer.toObject ? customer.toObject() : customer);
};

const fetchCustomerFromStripe = async ({ context, stripeCustomerId }) => {
  const { services } = context;
  const stripeCustomer = await services.stripe.customers.retrieve(stripeCustomerId);
  return stripeCustomer;
};

const syncInvoices = async ({ context, userId }) => {
  const { services, models } = context;
  const customer = await models.Customer.findOne({ userId });
  if (!customer) return [];
  const stripeInvoices = await services.stripe.invoices.list({ customer: customer.stripeCustomerId, limit: 100 });
  return stripeInvoices.data.map(inv => sanitizeInvoice(inv));
};

const fetchInvoicesFromStripe = async ({ context, stripeCustomerId, limit = 10, startingAfter }) => {
  const { services } = context;
  const stripeInvoices = await services.stripe.invoices.list({ customer: stripeCustomerId, limit, starting_after: startingAfter });
  return stripeInvoices.data.map(inv => sanitizeInvoice(inv));
};

const searchStripeInvoices = async ({ context, query, limit = 10 }) => {
  const { services } = context;
  const stripeInvoices = await services.stripe.invoices.list({ limit: 100 });
  const filtered = stripeInvoices.data.filter(inv =>
    inv.number?.includes(query) ||
    inv.customer_email?.includes(query)
  );
  return filtered.slice(0, limit).map(inv => sanitizeInvoice(inv));
};

export default withNamespace('billingStripe', {
  getOrCreateCustomer,
  fetchCustomerFromStripe,
  syncInvoices,
  fetchInvoicesFromStripe,
  searchStripeInvoices
});
