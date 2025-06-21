import actions from '../stripe-mutation.actions.js';
import { jest } from '@jest/globals';

const mockContext = (overrides = {}) => ({
  services: {
    stripe: {
      subscriptions: {
        create: jest.fn(),
        del: jest.fn(),
        update: jest.fn(),
      },
      paymentMethods: {
        attach: jest.fn(),
        detach: jest.fn(),
      },
      invoices: {
        retrieve: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
    },
  },
  models: {
    Customer: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
    Subscription: {
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    },
    PaymentMethod: {
      findByIdAndUpdate: jest.fn(),
    },
  },
  ...overrides
});

const findAction = (name) => actions.find(a => a.name === name)?.method;

describe('stripe-mutation.actions', () => {
  let context;
  beforeEach(() => {
    context = mockContext();
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('creates a subscription (happy path)', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.subscriptions.create.mockResolvedValue({ id: 'sub1', status: 'active' });
      context.models.Subscription.create.mockResolvedValue({ toObject: () => ({ _id: 's1', userId: 'u1', planId: 'p1', __v: 0, extra: 'strip' }) });
      const input = { context, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' };
      const result = await findAction('createSubscription')(input);
      expect(result).toMatchObject({ userId: 'u1', planId: 'p1' });
      expect(result.__v).toBeUndefined(); // # Reason: unknown fields should be stripped
      expect(context.models.Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', planId: 'p1', paymentMethodId: 'pm1', stripeSubscriptionId: 'sub1', status: 'active' }));
    });
    it('throws if customer not found (fail)', async () => {
      context.models.Customer.findOne.mockResolvedValue(null);
      await expect(findAction('createSubscription')({ context, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' })).rejects.toThrow('Customer not found');
    });
    it('throws on missing required fields (edge)', async () => {
      await expect(findAction('createSubscription')({ context, userId: 'u1' })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.subscriptions.create.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('createSubscription')({ context, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' })).rejects.toThrow('Stripe API error');
    });
    it('throws if context.models is missing (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('createSubscription')({ context: badContext, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' })).rejects.toThrow();
    });
    it('returns sanitized object if .toObject is missing', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.subscriptions.create.mockResolvedValue({ id: 'sub1', status: 'active' });
      context.models.Subscription.create.mockResolvedValue({ _id: 's1', userId: 'u1', planId: 'p1', __v: 0 });
      const input = { context, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' };
      const result = await findAction('createSubscription')(input);
      expect(result).toMatchObject({ userId: 'u1', planId: 'p1' });
      expect(result.__v).toBeUndefined();
    });
    it('returns null if Subscription.create returns undefined', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.subscriptions.create.mockResolvedValue({ id: 'sub1', status: 'active' });
      context.models.Subscription.create.mockResolvedValue(undefined);
      const input = { context, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' };
      const result = await findAction('createSubscription')(input);
      expect(result).toBeUndefined();
    });
  });

  describe('cancelSubscription', () => {
    it('cancels a subscription (happy path)', async () => {
      context.services.stripe.subscriptions.del.mockResolvedValue({});
      context.models.Subscription.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'cancelled', cancelledAt: expect.any(Date), __v: 0 }) })
      });
      const input = { context, stripeSubscriptionId: 'sub1' };
      const result = await findAction('cancelSubscription')(input);
      expect(result).toMatchObject({ status: 'cancelled' });
      expect(result.__v).toBeUndefined();
      expect(context.services.stripe.subscriptions.del).toHaveBeenCalledWith('sub1');
      expect(context.models.Subscription.findOneAndUpdate).toHaveBeenCalledWith(
        { stripeSubscriptionId: 'sub1' },
        { $set: { status: 'cancelled', cancelledAt: expect.any(Date) } },
        { new: true }
      );
    });
    it('returns null if subscription not found (edge)', async () => {
      context.services.stripe.subscriptions.del.mockResolvedValue({});
      context.models.Subscription.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const input = { context, stripeSubscriptionId: 'sub1' };
      const result = await findAction('cancelSubscription')(input);
      expect(result).toBeNull();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('cancelSubscription')({ context })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.subscriptions.del.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('cancelSubscription')({ context, stripeSubscriptionId: 'sub1' })).rejects.toThrow('Stripe API error');
    });
  });

  describe('updateSubscriptionInStripe', () => {
    it('updates a subscription (happy path)', async () => {
      context.services.stripe.subscriptions.update.mockResolvedValue({ status: 'active' });
      context.models.Subscription.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'active', __v: 0 }) })
      });
      const input = { context, stripeSubscriptionId: 'sub1', updates: { planId: 'p2' } };
      const result = await findAction('updateSubscriptionInStripe')(input);
      expect(result).toMatchObject({ status: 'active' });
      expect(result.__v).toBeUndefined();
      expect(context.services.stripe.subscriptions.update).toHaveBeenCalledWith('sub1', { planId: 'p2' });
    });
    it('returns null if subscription not found (edge)', async () => {
      context.services.stripe.subscriptions.update.mockResolvedValue({ status: 'active' });
      context.models.Subscription.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const input = { context, stripeSubscriptionId: 'sub1', updates: { planId: 'p2' } };
      const result = await findAction('updateSubscriptionInStripe')(input);
      expect(result).toBeNull();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('updateSubscriptionInStripe')({ context })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.subscriptions.update.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('updateSubscriptionInStripe')({ context, stripeSubscriptionId: 'sub1', updates: { planId: 'p2' } })).rejects.toThrow('Stripe API error');
    });
  });

  describe('attachPaymentMethod', () => {
    it('attaches a payment method (happy path)', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.paymentMethods.attach.mockResolvedValue({});
      context.models.PaymentMethod.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: 'pm1', userId: 'u1', __v: 0 }) })
      });
      const input = { context, userId: 'u1', paymentMethodId: 'pm1' };
      const result = await findAction('attachPaymentMethod')(input);
      expect(result).toMatchObject({ userId: 'u1' });
      expect(result.__v).toBeUndefined();
      expect(context.services.stripe.paymentMethods.attach).toHaveBeenCalledWith('pm1', { customer: 'sc1' });
    });
    it('throws if customer not found (fail)', async () => {
      context.models.Customer.findOne.mockResolvedValue(null);
      await expect(findAction('attachPaymentMethod')({ context, userId: 'u1', paymentMethodId: 'pm1' })).rejects.toThrow('Customer not found');
    });
    it('returns null if PaymentMethod not found (edge)', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.paymentMethods.attach.mockResolvedValue({});
      context.models.PaymentMethod.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const input = { context, userId: 'u1', paymentMethodId: 'pm1' };
      const result = await findAction('attachPaymentMethod')(input);
      expect(result).toBeNull();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('attachPaymentMethod')({ context, userId: 'u1' })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.paymentMethods.attach.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('attachPaymentMethod')({ context, userId: 'u1', paymentMethodId: 'pm1' })).rejects.toThrow('Stripe API error');
    });
    it('returns sanitized object if .toObject is missing', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.paymentMethods.attach.mockResolvedValue({});
      context.models.PaymentMethod.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: 'pm1', userId: 'u1', __v: 0 }) })
      });
      const input = { context, userId: 'u1', paymentMethodId: 'pm1' };
      const result = await findAction('attachPaymentMethod')(input);
      expect(result).toMatchObject({ userId: 'u1' });
      expect(result.__v).toBeUndefined();
    });
    it('returns null if PaymentMethod.findByIdAndUpdate returns undefined', async () => {
      context.models.Customer.findOne.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.paymentMethods.attach.mockResolvedValue({});
      context.models.PaymentMethod.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(undefined) })
      });
      const input = { context, userId: 'u1', paymentMethodId: 'pm1' };
      const result = await findAction('attachPaymentMethod')(input);
      expect(result).toBeNull();
    });
  });

  describe('detachPaymentMethod', () => {
    it('detaches a payment method (happy path)', async () => {
      context.services.stripe.paymentMethods.detach.mockResolvedValue({});
      context.models.PaymentMethod.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: 'pm1', __v: 0 }) })
      });
      const input = { context, paymentMethodId: 'pm1' };
      const result = await findAction('detachPaymentMethod')(input);
      expect(result).toMatchObject({ _id: 'pm1' });
      expect(result.__v).toBeUndefined();
      expect(context.services.stripe.paymentMethods.detach).toHaveBeenCalledWith('pm1');
    });
    it('returns null if PaymentMethod not found (edge)', async () => {
      context.services.stripe.paymentMethods.detach.mockResolvedValue({});
      context.models.PaymentMethod.findByIdAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const input = { context, paymentMethodId: 'pm1' };
      const result = await findAction('detachPaymentMethod')(input);
      expect(result).toBeNull();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('detachPaymentMethod')({ context })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.paymentMethods.detach.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('detachPaymentMethod')({ context, paymentMethodId: 'pm1' })).rejects.toThrow('Stripe API error');
    });
  });

  describe('refundInvoice', () => {
    it('refunds an invoice (happy path)', async () => {
      context.services.stripe.invoices.retrieve.mockResolvedValue({ payment_intent: 'pi_123' });
      context.services.stripe.refunds.create.mockResolvedValue({ id: 'r1', amount: 100 });
      const input = { context, stripeInvoiceId: 'inv1', amount: 100 };
      const result = await findAction('refundInvoice')(input);
      expect(result).toMatchObject({ id: 'r1', amount: 100 });
      expect(context.services.stripe.invoices.retrieve).toHaveBeenCalledWith('inv1');
      expect(context.services.stripe.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_123', amount: 100 });
    });
    it('throws if invoice has no payment_intent (fail)', async () => {
      context.services.stripe.invoices.retrieve.mockResolvedValue({});
      await expect(findAction('refundInvoice')({ context, stripeInvoiceId: 'inv1', amount: 100 })).rejects.toThrow('No payment intent for invoice');
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('refundInvoice')({ context, stripeInvoiceId: 'inv1' })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.invoices.retrieve.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('refundInvoice')({ context, stripeInvoiceId: 'inv1', amount: 100 })).rejects.toThrow('Stripe API error');
    });
  });

  describe('bulkCancelSubscriptions', () => {
    it('bulk cancels subscriptions (happy path)', async () => {
      context.services.stripe.subscriptions.del.mockResolvedValue({});
      context.models.Subscription.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'cancelled', __v: 0 }) })
      });
      const input = { context, stripeSubscriptionIds: ['sub1', 'sub2'] };
      const result = await findAction('bulkCancelSubscriptions')(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ status: 'cancelled' });
      expect(result[0].__v).toBeUndefined();
      expect(context.services.stripe.subscriptions.del).toHaveBeenCalledTimes(2);
    });
    it('returns empty array if no subscriptions found (edge)', async () => {
      context.services.stripe.subscriptions.del.mockResolvedValue({});
      context.models.Subscription.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const input = { context, stripeSubscriptionIds: ['sub1'] };
      const result = await findAction('bulkCancelSubscriptions')(input);
      expect(result).toStrictEqual([]);
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('bulkCancelSubscriptions')({ context })).rejects.toThrow();
    });
    it('handles Stripe API errors gracefully', async () => {
      context.services.stripe.subscriptions.del.mockRejectedValue(new Error('Stripe API error'));
      await expect(findAction('bulkCancelSubscriptions')({ context, stripeSubscriptionIds: ['sub1'] })).rejects.toThrow('Stripe API error');
    });
    it('filters out falsy results (mixed valid and null)', async () => {
      context.services.stripe.subscriptions.del.mockResolvedValue({});
      let call = 0;
      context.models.Subscription.findOneAndUpdate.mockImplementation(() => ({
        lean: () => ({ exec: () => Promise.resolve(call++ === 0 ? { _id: 's1', status: 'cancelled', __v: 0 } : null) })
      }));
      const input = { context, stripeSubscriptionIds: ['sub1', 'sub2'] };
      const result = await findAction('bulkCancelSubscriptions')(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ status: 'cancelled' });
    });
    it('returns empty array if all results are undefined', async () => {
      context.services.stripe.subscriptions.del.mockResolvedValue({});
      context.models.Subscription.findOneAndUpdate.mockImplementation(() => ({
        lean: () => ({ exec: () => Promise.resolve(undefined) })
      }));
      const input = { context, stripeSubscriptionIds: ['sub1', 'sub2'] };
      const result = await findAction('bulkCancelSubscriptions')(input);
      expect(result).toStrictEqual([]);
    });
  });

  // Composability/integration test: create, then cancel, then refund
  describe('integration: createSubscription -> cancelSubscription -> refundInvoice', () => {
    it('composes actions for a full subscription/refund flow', async () => {
      // # Reason: Ensures actions can be chained and mocks are isolated
      context.models.Customer.findOne.mockResolvedValueOnce({ userId: 'u1', stripeCustomerId: 'sc1' });
      context.services.stripe.subscriptions.create.mockResolvedValueOnce({ id: 'sub1', status: 'active' });
      context.models.Subscription.create.mockResolvedValueOnce({ toObject: () => ({ _id: 's1', userId: 'u1', planId: 'p1', stripeSubscriptionId: 'sub1' }) });
      // Cancel
      context.services.stripe.subscriptions.del.mockResolvedValueOnce({});
      context.models.Subscription.findOneAndUpdate.mockReturnValueOnce({
        lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'cancelled' }) })
      });
      // Refund
      context.services.stripe.invoices.retrieve.mockResolvedValueOnce({ payment_intent: 'pi_123' });
      context.services.stripe.refunds.create.mockResolvedValueOnce({ id: 'r1', amount: 100 });
      // Compose
      const created = await findAction('createSubscription')({ context, userId: 'u1', planId: 'p1', paymentMethodId: 'pm1' });
      expect(created.stripeSubscriptionId).toBe('sub1');
      const cancelled = await findAction('cancelSubscription')({ context, stripeSubscriptionId: 'sub1' });
      expect(cancelled.status).toBe('cancelled');
      const refund = await findAction('refundInvoice')({ context, stripeInvoiceId: 'inv1', amount: 100 });
      expect(refund).toMatchObject({ id: 'r1', amount: 100 });
    });
  });

  // --- Utility coverage for sanitize* helpers ---
  describe('sanitizeSubscription', () => {
    const { sanitizeSubscription } = require('../stripe-mutation.actions.js');
    it('returns null if input is null', () => {
      expect(sanitizeSubscription(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizeSubscription(undefined)).toBeUndefined();
    });
    it('removes __v from object', () => {
      expect(sanitizeSubscription({ _id: 's1', __v: 2, foo: 'bar' })).toEqual({ _id: 's1', foo: 'bar' });
    });
  });
  describe('sanitizeInvoice', () => {
    const { sanitizeInvoice } = require('../stripe-mutation.actions.js');
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
    const { sanitizeCustomer } = require('../stripe-mutation.actions.js');
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
  describe('sanitizePaymentMethod', () => {
    const { sanitizePaymentMethod } = require('../stripe-mutation.actions.js');
    it('returns null if input is null', () => {
      expect(sanitizePaymentMethod(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizePaymentMethod(undefined)).toBeUndefined();
    });
    it('removes __v from object', () => {
      expect(sanitizePaymentMethod({ _id: 'pm1', __v: 2, foo: 'bar' })).toEqual({ _id: 'pm1', foo: 'bar' });
    });
  });
}); 