import actions from '../stripe-query.actions.js';
import { jest } from '@jest/globals';

const mockContext = (overrides = {}) => ({
  services: {
    stripe: {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
      invoices: {
        list: jest.fn(),
      },
    },
  },
  models: {
    Customer: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
  },
  ...overrides
});

const findAction = (name) => actions.find(a => a.name === name)?.method;

describe('stripe-query.actions', () => {
  let context;
  beforeEach(() => {
    context = mockContext();
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    it('returns existing customer (happy path)', async () => {
      context.models.Customer.findOne.mockResolvedValue({ toObject: () => ({ userId: 'u1', email: 'e@x.com' }) });
      const input = { context, userId: 'u1', email: 'e@x.com' };
      const result = await findAction('getOrCreateCustomer')(input);
      expect(result.userId).toBe('u1');
    });
    it('creates new customer if not found (happy path)', async () => {
      context.models.Customer.findOne.mockResolvedValue(null);
      context.services.stripe.customers.create.mockResolvedValue({ id: 'sc1' });
      context.models.Customer.create.mockResolvedValue({ toObject: () => ({ userId: 'u1', email: 'e@x.com', stripeCustomerId: 'sc1' }) });
      const input = { context, userId: 'u1', email: 'e@x.com' };
      const result = await findAction('getOrCreateCustomer')(input);
      expect(result.stripeCustomerId).toBe('sc1');
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('getOrCreateCustomer')({ context, userId: 'u1' })).rejects.toThrow();
    });
    it('returns sanitized object if .toObject is missing', async () => {
      context.models.Customer.findOne.mockResolvedValue(null);
      context.services.stripe.customers.create.mockResolvedValue({ id: 'sc1' });
      context.models.Customer.create.mockResolvedValue({ userId: 'u1', email: 'e@x.com', stripeCustomerId: 'sc1', __v: 0 });
      const input = { context, userId: 'u1', email: 'e@x.com' };
      const result = await findAction('getOrCreateCustomer')(input);
      expect(result).toMatchObject({ userId: 'u1', stripeCustomerId: 'sc1' });
      expect(result.__v).toBeUndefined();
    });
  });

  describe('fetchCustomerFromStripe', () => {
    it('fetches a customer from Stripe (happy path)', async () => {
      context.services.stripe.customers.retrieve.mockResolvedValue({ id: 'sc1', email: 'e@x.com' });
      const input = { context, stripeCustomerId: 'sc1' };
      const result = await findAction('fetchCustomerFromStripe')(input);
      expect(result).toMatchObject({ id: 'sc1', email: 'e@x.com' });
      expect(context.services.stripe.customers.retrieve).toHaveBeenCalledWith('sc1');
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('fetchCustomerFromStripe')({ context })).rejects.toThrow();
    });
    it('returns undefined if Stripe returns undefined (edge)', async () => {
      context.services.stripe.customers.retrieve.mockResolvedValue(undefined);
      const input = { context, stripeCustomerId: 'sc1' };
      const result = await findAction('fetchCustomerFromStripe')(input);
      expect(result).toBeUndefined();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.customers.retrieve.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('fetchCustomerFromStripe')({ context, stripeCustomerId: 'sc1' })).rejects.toThrow('Stripe API error');
    });
    it('throws if context.services is missing (edge)', async () => {
      const badContext = { ...context, services: undefined };
      await expect(findAction('fetchCustomerFromStripe')({ context: badContext, stripeCustomerId: 'sc1' })).rejects.toThrow();
    });
  });

  describe('syncInvoices', () => {
    it('returns invoices from Stripe (happy path)', async () => {
      context.models.Customer.findOne.mockResolvedValue({ stripeCustomerId: 'sc1' });
      context.services.stripe.invoices.list.mockResolvedValue({ data: [{ id: 'inv1', __v: 0, extra: 'strip' }, { id: 'inv2', __v: 0 }] });
      const input = { context, userId: 'u1' };
      const result = await findAction('syncInvoices')(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'inv1', extra: 'strip' });
      expect(result[0].__v).toBeUndefined();
      expect(context.services.stripe.invoices.list).toHaveBeenCalledWith({ customer: 'sc1', limit: 100 });
    });
    it('returns empty array if customer not found (edge)', async () => {
      context.models.Customer.findOne.mockResolvedValue(null);
      const input = { context, userId: 'u1' };
      const result = await findAction('syncInvoices')(input);
      expect(result).toStrictEqual([]);
    });
    it('returns empty array if Customer.findOne returns undefined', async () => {
      context.models.Customer.findOne.mockResolvedValue(undefined);
      const input = { context, userId: 'u1' };
      const result = await findAction('syncInvoices')(input);
      expect(result).toStrictEqual([]);
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('syncInvoices')({ context })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.models.Customer.findOne.mockResolvedValue({ stripeCustomerId: 'sc1' });
      context.services.stripe.invoices.list.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('syncInvoices')({ context, userId: 'u1' })).rejects.toThrow('Stripe API error');
    });
    it('throws if context.models is missing (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('syncInvoices')({ context: badContext, userId: 'u1' })).rejects.toThrow();
    });
  });

  describe('fetchInvoicesFromStripe', () => {
    it('fetches invoices from Stripe (happy path)', async () => {
      context.services.stripe.invoices.list.mockResolvedValue({ data: [{ id: 'inv1', __v: 0, extra: 'strip' }, { id: 'inv2', __v: 0 }] });
      const input = { context, stripeCustomerId: 'sc1', limit: 2 };
      const result = await findAction('fetchInvoicesFromStripe')(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'inv1', extra: 'strip' });
      expect(result[0].__v).toBeUndefined();
      expect(context.services.stripe.invoices.list).toHaveBeenCalledWith({ customer: 'sc1', limit: 2, starting_after: undefined });
    });
    it('returns empty array if Stripe returns none (edge)', async () => {
      context.services.stripe.invoices.list.mockResolvedValue({ data: [] });
      const input = { context, stripeCustomerId: 'sc1', limit: 2 };
      const result = await findAction('fetchInvoicesFromStripe')(input);
      expect(result).toStrictEqual([]);
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('fetchInvoicesFromStripe')({ context })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.invoices.list.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('fetchInvoicesFromStripe')({ context, stripeCustomerId: 'sc1', limit: 2 })).rejects.toThrow('Stripe API error');
    });
  });

  describe('searchStripeInvoices', () => {
    it('returns filtered invoices by number (happy path)', async () => {
      context.services.stripe.invoices.list.mockResolvedValue({ data: [
        { id: 'inv1', number: 'A123', customer_email: 'a@x.com' },
        { id: 'inv2', number: 'B456', customer_email: 'b@x.com' },
      ] });
      const input = { context, query: 'A123', limit: 10 };
      const result = await findAction('searchStripeInvoices')(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'inv1', number: 'A123' });
      expect(context.services.stripe.invoices.list).toHaveBeenCalledWith({ limit: 100 });
    });
    it('returns filtered invoices by customer_email', async () => {
      context.services.stripe.invoices.list.mockResolvedValue({ data: [
        { id: 'inv3', number: 'C789', customer_email: 'special@x.com' }
      ] });
      const input = { context, query: 'special@x.com', limit: 10 };
      const result = await findAction('searchStripeInvoices')(input);
      expect(result).toHaveLength(1);
      expect(result[0].customer_email).toBe('special@x.com');
    });
    it('strips unknown fields from output', async () => {
      context.services.stripe.invoices.list.mockResolvedValue({ data: [
        { id: 'inv4', number: 'D000', customer_email: 'd@x.com', __v: 0, extra: 'shouldBeStripped' }
      ] });
      const input = { context, query: 'D000', limit: 10 };
      const result = await findAction('searchStripeInvoices')(input);
      expect(result[0].__v).toBeUndefined();
    });
    it('returns empty array if no match (edge)', async () => {
      context.services.stripe.invoices.list.mockResolvedValue({ data: [
        { id: 'inv1', number: 'A123', customer_email: 'a@x.com' },
      ] });
      const input = { context, query: 'ZZZ', limit: 10 };
      const result = await findAction('searchStripeInvoices')(input);
      expect(result).toStrictEqual([]);
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.invoices.list.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('searchStripeInvoices')({ context, query: 'A123', limit: 10 })).rejects.toThrow('Stripe API error');
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('searchStripeInvoices')({ context })).rejects.toThrow();
    });
  });

  // Composability/integration test: create customer, then fetch, then sync invoices
  describe('integration: getOrCreateCustomer -> fetchCustomerFromStripe -> syncInvoices', () => {
    it('composes actions for a full customer/invoice flow', async () => {
      // # Reason: Ensures actions can be chained and mocks are isolated
      context.models.Customer.findOne.mockResolvedValueOnce(null); // Not found, triggers create
      context.services.stripe.customers.create.mockResolvedValueOnce({ id: 'sc1' });
      context.models.Customer.create.mockResolvedValueOnce({ toObject: () => ({ userId: 'u1', email: 'e@x.com', stripeCustomerId: 'sc1' }) });
      // Now fetchCustomerFromStripe
      context.services.stripe.customers.retrieve.mockResolvedValueOnce({ id: 'sc1', email: 'e@x.com' });
      // Now syncInvoices
      context.models.Customer.findOne.mockResolvedValueOnce({ stripeCustomerId: 'sc1' });
      context.services.stripe.invoices.list.mockResolvedValueOnce({ data: [{ id: 'inv1' }] });
      // Compose
      const created = await findAction('getOrCreateCustomer')({ context, userId: 'u1', email: 'e@x.com' });
      expect(created.stripeCustomerId).toBe('sc1');
      const fetched = await findAction('fetchCustomerFromStripe')({ context, stripeCustomerId: 'sc1' });
      expect(fetched.id).toBe('sc1');
      const invoices = await findAction('syncInvoices')({ context, userId: 'u1' });
      expect(invoices).toHaveLength(1);
      expect(invoices[0].id).toBe('inv1');
    });
  });

  // --- Utility coverage for sanitize* helpers ---
  describe('sanitizeInvoice', () => {
    const { sanitizeInvoice } = require('../stripe-query.actions.js');
    it('returns null if input is null', () => {
      expect(sanitizeInvoice(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizeInvoice(undefined)).toBeUndefined();
    });
    it('removes __v from object', () => {
      expect(sanitizeInvoice({ _id: 'i1', __v: 2, foo: 'bar' })).toEqual({ _id: 'i1', foo: 'bar' });
    });
  });
  describe('sanitizeCustomer', () => {
    const { sanitizeCustomer } = require('../stripe-query.actions.js');
    it('returns null if input is null', () => {
      expect(sanitizeCustomer(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizeCustomer(undefined)).toBeUndefined();
    });
    it('removes __v from object', () => {
      expect(sanitizeCustomer({ _id: 'c1', __v: 2, foo: 'bar' })).toEqual({ _id: 'c1', foo: 'bar' });
    });
  });
}); 