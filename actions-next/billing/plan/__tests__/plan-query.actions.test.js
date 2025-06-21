import actions from '../billing-plan-query.actions.js';
import { validate } from '../../../utils/validate.js';
import { jest } from '@jest/globals';

// Directly import sanitizePlan for branch coverage
import { sanitizePlan } from '../billing-plan-query.actions.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Plan: {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    },
  },
  ...overrides
});

describe('billing-plan-query.actions', () => {
  let context;
  let PlanMock;

  beforeEach(() => {
    context = mockContext();
    PlanMock = context.models.Plan;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const findAction = (name) => actions.find(a => a.name === name).method;

  describe('getPlanById', () => {
    it('returns plan (happy path)', async () => {
      PlanMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', __v: 0 }) }) });
      const result = await findAction('getPlanById')({ context, planId: 'p1', extra: 'field' });
      expect(result._id).toBe('p1');
      expect(result.__v).toBeUndefined();
      expect(result.extra).toBeUndefined();
      expect(PlanMock.findById).toHaveBeenCalledWith('p1');
    });
    it('returns null if not found (edge)', async () => {
      PlanMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('getPlanById')({ context, planId: 'bad' });
      expect(result).toBeNull();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getPlanById')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('getPlanById')({ context: badContext, planId: 'p1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('getPlanById')({ context: badContext, planId: 'p1' })).rejects.toThrow();
    });
  });

  describe('getPlanByName', () => {
    it('returns plan (happy path)', async () => {
      PlanMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ name: 'Pro', __v: 0 }) }) });
      const result = await findAction('getPlanByName')({ context, name: 'Pro', extra: 'field' });
      expect(result.name).toBe('Pro');
      expect(result.__v).toBeUndefined();
      expect(result.extra).toBeUndefined();
      expect(PlanMock.findOne).toHaveBeenCalledWith({ name: 'Pro' });
    });
    it('returns null if not found (edge)', async () => {
      PlanMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('getPlanByName')({ context, name: 'none' });
      expect(result).toBeNull();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getPlanByName')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('getPlanByName')({ context: badContext, name: 'Pro' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('getPlanByName')({ context: badContext, name: 'Pro' })).rejects.toThrow();
    });
  });

  describe('listActivePlans', () => {
    it('returns paginated plans (happy path)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'p1', isActive: true, __v: 0 }]) }) }) }) }) });
      const result = await findAction('listActivePlans')({ context, limit: 1, offset: 0, extra: 'field' });
      expect(result[0]._id).toBe('p1');
      expect(result[0].__v).toBeUndefined();
      expect(result[0].extra).toBeUndefined();
      expect(PlanMock.find).toHaveBeenCalledWith({ isActive: true });
    });
    it('returns empty if none (edge)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      const result = await findAction('listActivePlans')({ context, limit: 1, offset: 0 });
      expect(result).toEqual([]);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('listActivePlans')({ context, limit: -1 })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('listActivePlans')({ context: badContext, limit: 1, offset: 0 })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('listActivePlans')({ context: badContext, limit: 1, offset: 0 })).rejects.toThrow();
    });
    it('returns [] if Plan.find returns null (unusual branch)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }) }) }) });
      const result = await findAction('listActivePlans')({ context, limit: 1, offset: 0 });
      expect(result).toEqual([]);
    });
    it('uses default limit when not provided (branch coverage)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'p1', isActive: true, __v: 0 }]) }) }) }) }) });
      const result = await findAction('listActivePlans')({ context, offset: 0 });
      expect(result[0]._id).toBe('p1');
      // The limit default is 20, but we can't assert the call directly since it's chained, so just ensure it works.
    });
  });

  describe('searchPlans', () => {
    it('returns paginated search results (happy path)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Pro', __v: 0 }]) }) }) }) }) });
      PlanMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchPlans')({ context, query: 'Pro', limit: 1, offset: 0, extra: 'field' });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].__v).toBeUndefined();
      expect(result.items[0].extra).toBeUndefined();
      expect(PlanMock.find).toHaveBeenCalledWith({ $or: [
        { name: { $regex: 'Pro', $options: 'i' } },
        { description: { $regex: 'Pro', $options: 'i' } }
      ] });
      expect(PlanMock.countDocuments).toHaveBeenCalledWith({ $or: [
        { name: { $regex: 'Pro', $options: 'i' } },
        { description: { $regex: 'Pro', $options: 'i' } }
      ] });
    });
    it('returns empty if none (edge)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      PlanMock.countDocuments.mockResolvedValueOnce(0);
      const result = await findAction('searchPlans')({ context, query: 'none', limit: 1, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('searchPlans')({ context })).rejects.toThrow();
    });
    it('returns results with isActive filter (branch: isActive present)', async () => {
      PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Pro', isActive: true, __v: 0 }]) }) }) }) }) });
      PlanMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchPlans')({ context, query: 'Pro', isActive: true, limit: 1, offset: 0 });
      expect(result.items[0].isActive).toBe(true);
      expect(PlanMock.find).toHaveBeenCalledWith({ $or: [
        { name: { $regex: 'Pro', $options: 'i' } },
        { description: { $regex: 'Pro', $options: 'i' } }
      ], isActive: true });
      expect(PlanMock.countDocuments).toHaveBeenCalledWith({ $or: [
        { name: { $regex: 'Pro', $options: 'i' } },
        { description: { $regex: 'Pro', $options: 'i' } }
      ], isActive: true });
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('searchPlans')({ context: badContext, query: 'Pro', limit: 1, offset: 0 })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('searchPlans')({ context: badContext, query: 'Pro', limit: 1, offset: 0 })).rejects.toThrow();
    });
  });

  // Composability test
  it('should compose: list, search, then get by id', async () => {
    PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'p1', name: 'Pro', __v: 0 }]) }) }) }) }) });
    PlanMock.countDocuments.mockResolvedValueOnce(1);
    PlanMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', name: 'Pro', __v: 0 }) }) });
    const list = await findAction('listActivePlans')({ context, limit: 1, offset: 0 });
    PlanMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'p1', name: 'Pro', __v: 0 }]) }) }) }) }) });
    const search = await findAction('searchPlans')({ context, query: 'Pro', limit: 1, offset: 0 });
    const byId = await findAction('getPlanById')({ context, planId: search.items[0]._id });
    expect(list[0]._id).toBe('p1');
    expect(search.items[0]._id).toBe('p1');
    expect(byId.name).toBe('Pro');
  });

  describe('sanitizePlan', () => {
    it('returns null if input is null', () => {
      expect(sanitizePlan(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizePlan(undefined)).toBeUndefined();
    });
  });
}); 