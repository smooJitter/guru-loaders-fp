import actions from '../billing-customer-bulk.actions.js';
import { validate } from '../../../utils/validate.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Customer: {
      updateMany: jest.fn(),
    },
  },
  ...overrides
});

describe('billing-customer-bulk.actions', () => {
  let context;
  let CustomerMock;

  beforeEach(() => {
    context = mockContext();
    CustomerMock = context.models.Customer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const findAction = (name) => actions.find(a => a.name === name).method;

  describe('bulkUpdateCustomers', () => {
    it('updates multiple customers (happy path)', async () => {
      CustomerMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
      const input = { context, ids: ['c1', 'c2'], data: { status: 'ACTIVE' } };
      const result = await findAction('bulkUpdateCustomers')(input);
      expect(result).toEqual({ matched: 2, modified: 2 });
      expect(CustomerMock.updateMany).toHaveBeenCalledWith({ _id: { $in: ['c1', 'c2'] } }, { $set: { status: 'ACTIVE' } });
    });
    it('throws on empty ids (edge)', async () => {
      await expect(findAction('bulkUpdateCustomers')({ context, ids: [], data: { status: 'ACTIVE' } })).rejects.toThrow();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('bulkUpdateCustomers')({ context, ids: ['c1'] })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (fail)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('bulkUpdateCustomers')({ context: badContext, ids: ['c1'], data: { status: 'ACTIVE' } })).rejects.toThrow();
    });
    it('throws if context is missing models (fail)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('bulkUpdateCustomers')({ context: badContext, ids: ['c1'], data: { status: 'ACTIVE' } })).rejects.toThrow();
    });
  });

  describe('bulkDeleteCustomers', () => {
    it('soft-deletes multiple customers (happy path)', async () => {
      CustomerMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
      const input = { context, ids: ['c1', 'c2'] };
      const result = await findAction('bulkDeleteCustomers')(input);
      expect(result).toEqual({ matched: 2, modified: 2 });
      expect(CustomerMock.updateMany).toHaveBeenCalledWith({ _id: { $in: ['c1', 'c2'] } }, { $set: { deletedAt: expect.any(Date), status: 'DELETED' } });
    });
    it('throws on empty ids (edge)', async () => {
      await expect(findAction('bulkDeleteCustomers')({ context, ids: [] })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (fail)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('bulkDeleteCustomers')({ context: badContext, ids: ['c1'] })).rejects.toThrow();
    });
    it('throws if context is missing models (fail)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('bulkDeleteCustomers')({ context: badContext, ids: ['c1'] })).rejects.toThrow();
    });
  });

  describe('bulkRestoreCustomers', () => {
    it('restores multiple customers (happy path)', async () => {
      CustomerMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
      const input = { context, ids: ['c1', 'c2'] };
      const result = await findAction('bulkRestoreCustomers')(input);
      expect(result).toEqual({ matched: 2, modified: 2 });
      expect(CustomerMock.updateMany).toHaveBeenCalledWith({ _id: { $in: ['c1', 'c2'] } }, { $set: { deletedAt: null, status: 'ACTIVE' } });
    });
    it('throws on empty ids (edge)', async () => {
      await expect(findAction('bulkRestoreCustomers')({ context, ids: [] })).rejects.toThrow();
    });
    it('throws if context.models.Customer is missing (fail)', async () => {
      const badContext = { ...context, models: { ...context.models, Customer: undefined } };
      await expect(findAction('bulkRestoreCustomers')({ context: badContext, ids: ['c1'] })).rejects.toThrow();
    });
    it('throws if context is missing models (fail)', async () => {
      const badContext = { ...context, models: undefined };
      await expect(findAction('bulkRestoreCustomers')({ context: badContext, ids: ['c1'] })).rejects.toThrow();
    });
  });

  // Composability test
  it('should compose: bulk update then bulk delete', async () => {
    CustomerMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
    CustomerMock.updateMany.mockResolvedValueOnce({ matchedCount: 2, modifiedCount: 2 });
    const updated = await findAction('bulkUpdateCustomers')({ context, ids: ['c1', 'c2'], data: { status: 'ACTIVE' } });
    const deleted = await findAction('bulkDeleteCustomers')({ context, ids: ['c1', 'c2'] });
    expect(updated.matched).toBe(2);
    expect(deleted.matched).toBe(2);
  });
}); 