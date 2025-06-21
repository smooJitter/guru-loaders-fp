import actions from '../billing-subscription-mutation.actions.js';
import { jest } from '@jest/globals';
import { sanitizeSubscription } from '../billing-subscription-mutation.actions.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Subscription: {},
  },
  ...overrides
});

const findAction = (name) => actions.find(a => a.name === name).method;

describe('billing-subscription-mutation.actions', () => {
  let context;
  let SubscriptionMock;
  let SaveMock;

  beforeEach(() => {
    context = mockContext();
    SaveMock = jest.fn();
    function Subscription(data) { Object.assign(this, data); }
    Subscription.prototype.save = SaveMock;
    Subscription.findOneAndUpdate = jest.fn();
    Subscription.updateMany = jest.fn();
    context.models.Subscription = Subscription;
    SubscriptionMock = context.models.Subscription;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('creates a subscription (happy path)', async () => {
      SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 's1', userId: 'u1', planId: 'p1', __v: 0 }) });
      const input = { context, userId: 'u1', planId: 'p1', stripeSubscriptionId: 'ss1' };
      const result = await findAction('createSubscription')(input);
      expect(result.userId).toBe('u1');
      expect(result.planId).toBe('p1');
      expect(result.__v).toBeUndefined();
      expect(SaveMock).toHaveBeenCalledTimes(1);
    });
    it('strips unknown fields (yup noUnknown)', async () => {
      SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 's1', userId: 'u1', planId: 'p1', __v: 0 }) });
      const input = { context, userId: 'u1', planId: 'p1', stripeSubscriptionId: 'ss1', extra: 'field' };
      const result = await findAction('createSubscription')(input);
      expect(result.extra).toBeUndefined();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('createSubscription')({ context, userId: 'u1' })).rejects.toThrow(/required/);
    });
    it('throws if context.models.Subscription is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Subscription: undefined } };
      await expect(findAction('createSubscription')({ context: badContext, userId: 'u1', planId: 'p1', stripeSubscriptionId: 'ss1' })).rejects.toThrow();
    });
    it('throws if context.models is missing (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('createSubscription')({ context: badContext, userId: 'u1', planId: 'p1', stripeSubscriptionId: 'ss1' })).rejects.toThrow();
    });
  });

  describe('updateSubscriptionStatus', () => {
    it('updates status (happy path)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'canceled', __v: 0 }) }) });
      const input = { context, stripeSubscriptionId: 'ss1', status: 'canceled' };
      const result = await findAction('updateSubscriptionStatus')(input);
      expect(result.status).toBe('canceled');
      expect(result.__v).toBeUndefined();
      expect(SubscriptionMock.findOneAndUpdate).toHaveBeenCalledWith(
        { stripeSubscriptionId: 'ss1' },
        { $set: { status: 'canceled' } },
        { new: true }
      );
    });
    it('throws if not found (fail)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('updateSubscriptionStatus')({ context, stripeSubscriptionId: 'bad', status: 'canceled' })).rejects.toThrow('Subscription not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('updateSubscriptionStatus')({ context, stripeSubscriptionId: 'ss1' })).rejects.toThrow();
    });
  });

  describe('setCancelAtPeriodEnd', () => {
    it('sets cancelAtPeriodEnd (happy path)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', cancelAtPeriodEnd: true, __v: 0 }) }) });
      const input = { context, stripeSubscriptionId: 'ss1', cancelAtPeriodEnd: true };
      const result = await findAction('setCancelAtPeriodEnd')(input);
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.__v).toBeUndefined();
      expect(SubscriptionMock.findOneAndUpdate).toHaveBeenCalledWith(
        { stripeSubscriptionId: 'ss1' },
        { $set: { cancelAtPeriodEnd: true } },
        { new: true }
      );
    });
    it('throws if not found (fail)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('setCancelAtPeriodEnd')({ context, stripeSubscriptionId: 'bad', cancelAtPeriodEnd: true })).rejects.toThrow('Subscription not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('setCancelAtPeriodEnd')({ context, stripeSubscriptionId: 'ss1' })).rejects.toThrow();
    });
  });

  describe('updateSubscription', () => {
    it('updates a subscription (happy path)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', planId: 'p2', __v: 0 }) }) });
      const input = { context, stripeSubscriptionId: 'ss1', data: { planId: 'p2' } };
      const result = await findAction('updateSubscription')(input);
      expect(result.planId).toBe('p2');
      expect(result.__v).toBeUndefined();
      expect(SubscriptionMock.findOneAndUpdate).toHaveBeenCalledWith(
        { stripeSubscriptionId: 'ss1' },
        { $set: { planId: 'p2' } },
        { new: true, runValidators: true }
      );
    });
    it('throws if not found (fail)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('updateSubscription')({ context, stripeSubscriptionId: 'bad', data: { planId: 'p2' } })).rejects.toThrow('Subscription not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('updateSubscription')({ context, stripeSubscriptionId: 'ss1' })).rejects.toThrow();
    });
  });

  describe('deleteSubscription', () => {
    it('soft-deletes a subscription (happy path)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'cancelled', __v: 0 }) }) });
      const input = { context, stripeSubscriptionId: 'ss1' };
      const result = await findAction('deleteSubscription')(input);
      expect(result.status).toBe('cancelled');
      expect(result.__v).toBeUndefined();
      expect(SubscriptionMock.findOneAndUpdate).toHaveBeenCalledWith(
        { stripeSubscriptionId: 'ss1' },
        { $set: { deletedAt: expect.any(Date), status: 'cancelled' } },
        { new: true }
      );
    });
    it('throws if not found (fail)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('deleteSubscription')({ context, stripeSubscriptionId: 'bad' })).rejects.toThrow('Subscription not found');
    });
    it('throws on missing id (edge)', async () => {
      await expect(findAction('deleteSubscription')({ context })).rejects.toThrow();
    });
  });

  describe('restoreSubscription', () => {
    it('restores a subscription (happy path)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'active', __v: 0 }) }) });
      const input = { context, stripeSubscriptionId: 'ss1' };
      const result = await findAction('restoreSubscription')(input);
      expect(result.status).toBe('active');
      expect(result.__v).toBeUndefined();
      expect(SubscriptionMock.findOneAndUpdate).toHaveBeenCalledWith(
        { stripeSubscriptionId: 'ss1' },
        { $set: { deletedAt: null, status: 'active' } },
        { new: true }
      );
    });
    it('throws if not found (fail)', async () => {
      SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('restoreSubscription')({ context, stripeSubscriptionId: 'bad' })).rejects.toThrow('Subscription not found');
    });
    it('throws on missing id (edge)', async () => {
      await expect(findAction('restoreSubscription')({ context })).rejects.toThrow();
    });
  });

  describe('bulkUpdateSubscriptions', () => {
    it('bulk updates subscriptions (happy path)', async () => {
      SubscriptionMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
      const input = { context, ids: ['s1', 's2'], data: { status: 'paused' } };
      const result = await findAction('bulkUpdateSubscriptions')(input);
      expect(result).toEqual({ matched: 2, modified: 2 });
      expect(SubscriptionMock.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['s1', 's2'] } },
        { $set: { status: 'paused' } }
      );
    });
    it('throws on empty ids (edge)', async () => {
      await expect(findAction('bulkUpdateSubscriptions')({ context, ids: [], data: { status: 'paused' } })).rejects.toThrow();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('bulkUpdateSubscriptions')({ context, ids: ['s1'] })).rejects.toThrow();
    });
    it('throws on missing data (edge)', async () => {
      await expect(findAction('bulkUpdateSubscriptions')({ context, ids: ['s1'] })).rejects.toThrow();
    });
  });

  describe('sanitizeSubscription', () => {
    it('returns null if input is null', () => {
      expect(sanitizeSubscription(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizeSubscription(undefined)).toBeUndefined();
    });
  });

  it('should compose: create, update, delete, then restore', async () => {
    SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 's1', userId: 'u1', planId: 'p1', __v: 0 }) });
    SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', planId: 'p2', __v: 0 }) }) });
    SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'cancelled', __v: 0 }) }) });
    SubscriptionMock.findOneAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', status: 'active', __v: 0 }) }) });
    const created = await findAction('createSubscription')({ context, userId: 'u1', planId: 'p1', stripeSubscriptionId: 'ss1' });
    const updated = await findAction('updateSubscription')({ context, stripeSubscriptionId: 'ss1', data: { planId: 'p2' } });
    const deleted = await findAction('deleteSubscription')({ context, stripeSubscriptionId: 'ss1' });
    const restored = await findAction('restoreSubscription')({ context, stripeSubscriptionId: 'ss1' });
    expect(updated.planId).toBe('p2');
    expect(deleted.status).toBe('cancelled');
    expect(restored.status).toBe('active');
  });
}); 