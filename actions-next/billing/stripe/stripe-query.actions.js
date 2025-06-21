import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  getOrCreateCustomerSchema,
  fetchCustomerFromStripeSchema,
  syncInvoicesSchema,
  fetchInvoicesFromStripeSchema,
  searchStripeInvoicesSchema
} from './validation.js';

// Local helpers (plain JS, no Ramda)
const omit = (obj, keys) => {
  const result = { ...obj };
  for (const key of keys) delete result[key];
  return result;
};
const sanitizeInvoice = (inv) => inv ? omit(inv, ['__v']) : inv;
const sanitizeCustomer = (cust) => cust ? omit(cust, ['__v']) : cust;

/**
 * Get or create a customer in Stripe and local DB
 * @param {object} input - { context, userId, email }
 * @returns {Promise<object>} The customer object
 */
const getOrCreateCustomer = async ({ context, userId, email }) => {
  await validate(getOrCreateCustomerSchema, { context, userId, email });
  const { services, models } = context;
  let customer = await models.Customer.findOne({ userId });
  if (!customer) {
    const stripeCustomer = await services.stripe.customers.create({ email });
    customer = await models.Customer.create({ userId, email, stripeCustomerId: stripeCustomer.id });
  }
  return sanitizeCustomer(customer.toObject ? customer.toObject() : customer);
};

/**
 * Fetch a customer from Stripe by Stripe customer ID
 * @param {object} input - { context, stripeCustomerId }
 * @returns {Promise<object>} The Stripe customer object
 */
const fetchCustomerFromStripe = async ({ context, stripeCustomerId }) => {
  await validate(fetchCustomerFromStripeSchema, { context, stripeCustomerId });
  const { services } = context;
  const stripeCustomer = await services.stripe.customers.retrieve(stripeCustomerId);
  return stripeCustomer;
};

/**
 * Sync invoices from Stripe to local DB (returns Stripe invoices only)
 * @param {object} input - { context, userId }
 * @returns {Promise<object[]>} Array of Stripe invoice objects
 */
const syncInvoices = async ({ context, userId }) => {
  await validate(syncInvoicesSchema, { context, userId });
  const { services, models } = context;
  const customer = await models.Customer.findOne({ userId });
  if (!customer) return [];
  const stripeInvoices = await services.stripe.invoices.list({ customer: customer.stripeCustomerId, limit: 100 });
  return stripeInvoices.data.map(inv => sanitizeInvoice(inv));
};

/**
 * Fetch invoices from Stripe by Stripe customer ID
 * @param {object} input - { context, stripeCustomerId, limit, startingAfter }
 * @returns {Promise<object[]>} Array of Stripe invoice objects
 */
const fetchInvoicesFromStripe = async ({ context, stripeCustomerId, limit = 10, startingAfter }) => {
  await validate(fetchInvoicesFromStripeSchema, { context, stripeCustomerId, limit, startingAfter });
  const { services } = context;
  const stripeInvoices = await services.stripe.invoices.list({ customer: stripeCustomerId, limit, starting_after: startingAfter });
  return stripeInvoices.data.map(inv => sanitizeInvoice(inv));
};

/**
 * Search Stripe invoices by query (number or customer_email)
 * @param {object} input - { context, query, limit }
 * @returns {Promise<object[]>} Array of matching Stripe invoice objects
 */
const searchStripeInvoices = async ({ context, query, limit = 10 }) => {
  await validate(searchStripeInvoicesSchema, { context, query, limit });
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

export { sanitizeInvoice, sanitizeCustomer }; 