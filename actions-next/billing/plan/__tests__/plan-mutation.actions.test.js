import actions from '../billing-plan-mutation.actions.js';
import { validate } from '../../../utils/validate.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Plan: {
      save: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    },
  },
  ...overrides
});

describe('billing-plan-mutation.actions', () => {
  let context;
  let PlanMock;
  let SaveMock;

  beforeEach(() => {
    context = mockContext();
    PlanMock = context.models.Plan;
    SaveMock = jest.fn();
    // Patch constructor for createPlan
    function Plan(data) { Object.assign(this, data); }
    Plan.prototype.save = SaveMock;
    context.models.Plan = Plan;
    context.models.Plan.findByIdAndUpdate = jest.fn();
    context.models.Plan.updateMany = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const findAction = (name) => actions.find(a => a.name === name).method;

  describe('createPlan', () => {
    it('creates a plan (happy path)', async () => {
      SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 'p1', name: 'Pro', stripePriceId: 'sp1', __v: 0 }) });
      const input = { context, name: 'Pro', stripePriceId: 'sp1', isActive: true };
      const result = await findAction('createPlan')(input);
      expect(result.name).toBe('Pro');
      expect(result.stripePriceId).toBe('sp1');
      expect(result.__v).toBeUndefined();
      expect(SaveMock).toHaveBeenCalled();
    });
    it('strips unknown fields (yup noUnknown)', async () => {
      SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 'p1', name: 'Pro', stripePriceId: 'sp1', __v: 0 }) });
      const input = { context, name: 'Pro', stripePriceId: 'sp1', unknown: 'field' };
      const result = await findAction('createPlan')(input);
      expect(result.unknown).toBeUndefined();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('createPlan')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('createPlan')({ context: badContext, name: 'Pro', stripePriceId: 'sp1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('createPlan')({ context: badContext, name: 'Pro', stripePriceId: 'sp1' })).rejects.toThrow();
    });
  });

  describe('updatePlanStatus', () => {
    it('updates plan status (happy path)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', isActive: false, __v: 0 }) }) });
      const input = { context, id: 'p1', isActive: false };
      const result = await findAction('updatePlanStatus')(input);
      expect(result.isActive).toBe(false);
      expect(result.__v).toBeUndefined();
      expect(context.models.Plan.findByIdAndUpdate).toHaveBeenCalledWith('p1', { $set: { isActive: false } }, { new: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const input = { context, id: 'bad', isActive: false };
      await expect(findAction('updatePlanStatus')(input)).rejects.toThrow('Plan not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('updatePlanStatus')({ context, id: 'p1' })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('updatePlanStatus')({ context: badContext, id: 'p1', isActive: false })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('updatePlanStatus')({ context: badContext, id: 'p1', isActive: false })).rejects.toThrow();
    });
  });

  describe('updatePlan', () => {
    it('updates a plan (happy path)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', name: 'Pro', __v: 0 }) }) });
      const input = { context, id: 'p1', data: { name: 'Pro' } };
      const result = await findAction('updatePlan')(input);
      expect(result._id).toBe('p1');
      expect(result.__v).toBeUndefined();
      expect(context.models.Plan.findByIdAndUpdate).toHaveBeenCalledWith('p1', { $set: { name: 'Pro' } }, { new: true, runValidators: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const input = { context, id: 'bad', data: { name: 'Pro' } };
      await expect(findAction('updatePlan')(input)).rejects.toThrow('Plan not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('updatePlan')({ context, id: 'p1' })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('updatePlan')({ context: badContext, id: 'p1', data: { name: 'Pro' } })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('updatePlan')({ context: badContext, id: 'p1', data: { name: 'Pro' } })).rejects.toThrow();
    });
  });

  describe('deletePlan', () => {
    it('soft-deletes a plan (happy path)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', isActive: false, __v: 0 }) }) });
      const input = { context, id: 'p1' };
      const result = await findAction('deletePlan')(input);
      expect(result.isActive).toBe(false);
      expect(result.__v).toBeUndefined();
      expect(context.models.Plan.findByIdAndUpdate).toHaveBeenCalledWith('p1', { $set: { deletedAt: expect.any(Date), isActive: false } }, { new: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('deletePlan')({ context, id: 'bad' })).rejects.toThrow('Plan not found');
    });
    it('throws on missing id (edge)', async () => {
      await expect(findAction('deletePlan')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('deletePlan')({ context: badContext, id: 'p1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('deletePlan')({ context: badContext, id: 'p1' })).rejects.toThrow();
    });
  });

  describe('restorePlan', () => {
    it('restores a plan (happy path)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', isActive: true, __v: 0 }) }) });
      const input = { context, id: 'p1' };
      const result = await findAction('restorePlan')(input);
      expect(result.isActive).toBe(true);
      expect(result.__v).toBeUndefined();
      expect(context.models.Plan.findByIdAndUpdate).toHaveBeenCalledWith('p1', { $set: { deletedAt: null, isActive: true } }, { new: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('restorePlan')({ context, id: 'bad' })).rejects.toThrow('Plan not found');
    });
    it('throws on missing id (edge)', async () => {
      await expect(findAction('restorePlan')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('restorePlan')({ context: badContext, id: 'p1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('restorePlan')({ context: badContext, id: 'p1' })).rejects.toThrow();
    });
  });

  describe('bulkUpdatePlans', () => {
    it('bulk updates plans (happy path)', async () => {
      context.models.Plan.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
      const input = { context, ids: ['p1', 'p2'], data: { isActive: false } };
      const result = await findAction('bulkUpdatePlans')(input);
      expect(result).toEqual({ matched: 2, modified: 2 });
      expect(context.models.Plan.updateMany).toHaveBeenCalledWith({ _id: { $in: ['p1', 'p2'] } }, { $set: { isActive: false } });
    });
    it('throws on empty ids (edge)', async () => {
      await expect(findAction('bulkUpdatePlans')({ context, ids: [], data: { isActive: false } })).rejects.toThrow();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('bulkUpdatePlans')({ context, ids: ['p1'] })).rejects.toThrow();
    });
    it('throws if context.models.Plan is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Plan: undefined } };
      await expect(findAction('bulkUpdatePlans')({ context: badContext, ids: ['p1'], data: { isActive: false } })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('bulkUpdatePlans')({ context: badContext, ids: ['p1'], data: { isActive: false } })).rejects.toThrow();
    });
  });

  // Composability test
  it('should compose: create, update, then delete', async () => {
    SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 'p1', name: 'Pro', stripePriceId: 'sp1', __v: 0 }) });
    context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', name: 'Pro', description: 'new', __v: 0 }) }) });
    context.models.Plan.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'p1', isActive: false, __v: 0 }) }) });
    const created = await findAction('createPlan')({ context, name: 'Pro', stripePriceId: 'sp1', isActive: true });
    const updated = await findAction('updatePlan')({ context, id: created._id, data: { description: 'new' } });
    const deleted = await findAction('deletePlan')({ context, id: created._id });
    expect(updated.description).toBe('new');
    expect(deleted.isActive).toBe(false);
  });
}); 