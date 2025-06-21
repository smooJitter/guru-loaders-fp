import actions from '../billing-customer-mutation.actions.js';
import { validate } from '../../../utils/validate.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Customer: {
      save: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  },
  ...overrides
});

describe('billing-customer-mutation.actions', () => {
  let context;
  let CustomerMock;
  let SaveMock;

  beforeEach(() => {
    context = mockContext();
    CustomerMock = context.models.Customer;
    SaveMock = jest.fn();
    // Patch constructor for createCustomer
    function Customer(data) { Object.assign(this, data); }
    Customer.prototype.save = SaveMock;
    context.models.Customer = Customer;
    context.models.Customer.findByIdAndUpdate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const findAction = (name) => actions.find(a => a.name === name).method;

  describe('createCustomer', () => {
    it('creates a customer (happy path)', async () => {
      SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 'c1', userId: 'u1', stripeCustomerId: 's1', __v: 0 }) });
      const input = { context, userId: 'u1', stripeCustomerId: 's1', billingAddress: '123 Main' };
      const result = await findAction('createCustomer')(input);
      expect(result.userId).toBe('u1');
      expect(result.stripeCustomerId).toBe('s1');
      expect(result.__v).toBeUndefined();
      expect(SaveMock).toHaveBeenCalled();
    });
    it('throws on missing required fields (fail)', async () => {
      await expect(findAction('createCustomer')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('createCustomer')({ context: badContext, userId: 'u1', stripeCustomerId: 's1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('createCustomer')({ context: badContext, userId: 'u1', stripeCustomerId: 's1' })).rejects.toThrow();
    });
  });

  describe('updateCustomer', () => {
    it('updates a customer (happy path)', async () => {
      context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'c1', userId: 'u1', __v: 0 }) }) });
      const input = { context, id: 'c1', data: { billingAddress: '456 New' } };
      const result = await findAction('updateCustomer')(input);
      expect(result._id).toBe('c1');
      expect(result.__v).toBeUndefined();
      expect(context.models.Customer.findByIdAndUpdate).toHaveBeenCalledWith('c1', { $set: { billingAddress: '456 New' } }, { new: true, runValidators: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const input = { context, id: 'bad', data: { billingAddress: 'x' } };
      await expect(findAction('updateCustomer')(input)).rejects.toThrow('Customer not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('updateCustomer')({ context, id: 'c1' })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('updateCustomer')({ context: badContext, id: 'c1', data: { billingAddress: 'x' } })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('updateCustomer')({ context: badContext, id: 'c1', data: { billingAddress: 'x' } })).rejects.toThrow();
    });
  });

  describe('deleteCustomer', () => {
    it('soft-deletes a customer (happy path)', async () => {
      context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'c1', status: 'DELETED', __v: 0 }) }) });
      const input = { context, id: 'c1' };
      const result = await findAction('deleteCustomer')(input);
      expect(result.status).toBe('DELETED');
      expect(result.__v).toBeUndefined();
      expect(context.models.Customer.findByIdAndUpdate).toHaveBeenCalledWith('c1', { $set: { deletedAt: expect.any(Date), status: 'DELETED' } }, { new: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('deleteCustomer')({ context, id: 'bad' })).rejects.toThrow('Customer not found');
    });
    it('throws on missing id (edge)', async () => {
      await expect(findAction('deleteCustomer')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('deleteCustomer')({ context: badContext, id: 'c1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('deleteCustomer')({ context: badContext, id: 'c1' })).rejects.toThrow();
    });
  });

  describe('restoreCustomer', () => {
    it('restores a customer (happy path)', async () => {
      context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'c1', status: 'ACTIVE', __v: 0 }) }) });
      const input = { context, id: 'c1' };
      const result = await findAction('restoreCustomer')(input);
      expect(result.status).toBe('ACTIVE');
      expect(result.__v).toBeUndefined();
      expect(context.models.Customer.findByIdAndUpdate).toHaveBeenCalledWith('c1', { $set: { deletedAt: null, status: 'ACTIVE' } }, { new: true });
    });
    it('throws if not found (fail)', async () => {
      context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('restoreCustomer')({ context, id: 'bad' })).rejects.toThrow('Customer not found');
    });
    it('throws on missing id (edge)', async () => {
      await expect(findAction('restoreCustomer')({ context })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (edge)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('restoreCustomer')({ context: badContext, id: 'c1' })).rejects.toThrow();
    });
    it('throws if context is missing models (edge)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('restoreCustomer')({ context: badContext, id: 'c1' })).rejects.toThrow();
    });
  });

  // Composability test
  it('should compose: create then update', async () => {
    SaveMock.mockResolvedValueOnce({ toObject: () => ({ _id: 'c1', userId: 'u1', stripeCustomerId: 's1', __v: 0 }) });
    context.models.Customer.findByIdAndUpdate.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'c1', userId: 'u1', billingAddress: 'new', __v: 0 }) }) });
    const created = await findAction('createCustomer')({ context, userId: 'u1', stripeCustomerId: 's1', billingAddress: '123 Main' });
    const updated = await findAction('updateCustomer')({ context, id: created._id, data: { billingAddress: 'new' } });
    expect(updated.billingAddress).toBe('new');
  });
}); 