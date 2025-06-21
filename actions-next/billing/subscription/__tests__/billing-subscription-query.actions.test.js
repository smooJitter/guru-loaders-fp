import actions from '../billing-subscription-query.actions.js';
import { jest } from '@jest/globals';
import { sanitizeSubscription } from '../billing-subscription-query.actions.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Subscription: {
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    },
  },
  ...overrides
});

const findAction = (name) => actions.find(a => a.name === name).method;

describe('billing-subscription-query.actions', () => {
  let context;
  let SubscriptionMock;

  beforeEach(() => {
    context = mockContext();
    SubscriptionMock = context.models.Subscription;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionByUser', () => {
    it('returns subscription (happy path)', async () => {
      SubscriptionMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', userId: 'u1', __v: 0 }) }) });
      const result = await findAction('getSubscriptionByUser')({ context, userId: 'u1', extra: 'field' });
      expect(result.userId).toBe('u1');
      expect(result.__v).toBeUndefined();
      expect(result.extra).toBeUndefined();
      expect(SubscriptionMock.findOne).toHaveBeenCalledWith({ userId: 'u1' });
    });
    it('returns null if not found (edge)', async () => {
      SubscriptionMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('getSubscriptionByUser')({ context, userId: 'none' });
      expect(result).toBeNull();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getSubscriptionByUser')({ context })).rejects.toThrow(/required/);
    });
    it('throws if context.models.Subscription is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Subscription: undefined } };
      await expect(findAction('getSubscriptionByUser')({ context: badContext, userId: 'u1' })).rejects.toThrow();
    });
    it('throws if context.models is missing (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('getSubscriptionByUser')({ context: badContext, userId: 'u1' })).rejects.toThrow();
    });
  });

  describe('getSubscriptionByStripeId', () => {
    it('returns subscription (happy path)', async () => {
      SubscriptionMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', stripeSubscriptionId: 'ss1', __v: 0 }) }) });
      const result = await findAction('getSubscriptionByStripeId')({ context, stripeSubscriptionId: 'ss1' });
      expect(result.stripeSubscriptionId).toBe('ss1');
      expect(result.__v).toBeUndefined();
      expect(SubscriptionMock.findOne).toHaveBeenCalledWith({ stripeSubscriptionId: 'ss1' });
    });
    it('returns null if not found (edge)', async () => {
      SubscriptionMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('getSubscriptionByStripeId')({ context, stripeSubscriptionId: 'none' });
      expect(result).toBeNull();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getSubscriptionByStripeId')({ context })).rejects.toThrow();
    });
  });

  describe('listActiveSubscriptions', () => {
    it('returns active subscriptions (happy path)', async () => {
      SubscriptionMock.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve([{ _id: 's1', status: 'active', __v: 0 }]) }) });
      const result = await findAction('listActiveSubscriptions')({ context });
      expect(result[0].status).toBe('active');
      expect(result[0].__v).toBeUndefined();
      expect(SubscriptionMock.find).toHaveBeenCalledWith({ status: 'active' });
    });
    it('returns empty if none (edge)', async () => {
      SubscriptionMock.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve([]) }) });
      const result = await findAction('listActiveSubscriptions')({ context });
      expect(result).toEqual([]);
    });
    it('returns [] if Subscription.find returns null (unusual branch)', async () => {
      SubscriptionMock.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('listActiveSubscriptions')({ context });
      expect(result).toEqual([]);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('listActiveSubscriptions')({})).rejects.toThrow();
    });
    it('throws if context.models.Subscription is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Subscription: undefined } };
      await expect(findAction('listActiveSubscriptions')({ context: badContext })).rejects.toThrow();
    });
    it('throws if context.models is missing (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('listActiveSubscriptions')({ context: badContext })).rejects.toThrow();
    });
  });

  describe('searchSubscriptions', () => {
    it('returns paginated search results (happy path)', async () => {
      SubscriptionMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ userId: 'u1', __v: 0 }]) }) }) }) }) });
      SubscriptionMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchSubscriptions')({ context, query: 'u1', limit: 1, offset: 0, extra: 'field' });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].__v).toBeUndefined();
      expect(result.items[0].extra).toBeUndefined();
      expect(SubscriptionMock.find).toHaveBeenCalled();
      expect(SubscriptionMock.countDocuments).toHaveBeenCalled();
    });
    it('returns empty if none (edge)', async () => {
      SubscriptionMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      SubscriptionMock.countDocuments.mockResolvedValueOnce(0);
      const result = await findAction('searchSubscriptions')({ context, query: 'none', limit: 1, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('searchSubscriptions')({ context })).rejects.toThrow();
    });
    it('returns results with status filter (branch: status present)', async () => {
      SubscriptionMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ userId: 'u1', status: 'active', __v: 0 }]) }) }) }) }) });
      SubscriptionMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchSubscriptions')({ context, query: 'u1', status: 'active', limit: 1, offset: 0 });
      expect(result.items[0].status).toBe('active');
      expect(SubscriptionMock.find).toHaveBeenCalled();
      expect(SubscriptionMock.countDocuments).toHaveBeenCalled();
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

  // Composability test
  it('should compose: search then get by stripe id', async () => {
    SubscriptionMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ stripeSubscriptionId: 'ss1', __v: 0 }]) }) }) }) }) });
    SubscriptionMock.countDocuments.mockResolvedValueOnce(1);
    SubscriptionMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 's1', stripeSubscriptionId: 'ss1', __v: 0 }) }) });
    const search = await findAction('searchSubscriptions')({ context, query: 'ss1', limit: 1, offset: 0 });
    const byId = await findAction('getSubscriptionByStripeId')({ context, stripeSubscriptionId: search.items[0].stripeSubscriptionId });
    expect(byId.stripeSubscriptionId).toBe('ss1');
  });
}); 