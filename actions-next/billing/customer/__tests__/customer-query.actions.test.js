import actions from '../billing-customer-query.actions.js';
import * as yup from 'yup';
import { validate } from '../../../utils/validate.js';
import * as queryActions from '../billing-customer-query.actions.js';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    Customer: {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    },
  },
  ...overrides
});

describe('billing-customer-query.actions', () => {
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

  // --- Expanded: sanitizeCustomer utility coverage ---
  describe('sanitizeCustomer utility', () => {
    const { sanitizeCustomer } = queryActions;
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

  it('should throw if context is missing models', async () => {
    const badContext = { ...context, models: undefined };
    await expect(findAction('getCustomerById')({ context: badContext, customerId: 'c1' })).rejects.toThrow();
    await expect(findAction('getCustomerByStripeId')({ context: badContext, stripeCustomerId: 's1' })).rejects.toThrow();
    await expect(findAction('getCustomersByUser')({ context: badContext, userId: 'u1' })).rejects.toThrow();
    await expect(findAction('listActiveCustomers')({ context: badContext, limit: 1, offset: 0 })).rejects.toThrow();
    await expect(findAction('listDeletedCustomers')({ context: badContext, limit: 1, offset: 0 })).rejects.toThrow();
    await expect(findAction('searchCustomers')({ context: badContext, query: 'foo', limit: 1, offset: 0 })).rejects.toThrow();
    await expect(findAction('getCustomerByEmail')({ context: badContext, email: 'a@example.com' })).rejects.toThrow();
    await expect(findAction('getCustomersByStatus')({ context: badContext, status: 'ACTIVE', limit: 1, offset: 0 })).rejects.toThrow();
  });

  it('should throw if context.models is missing Customer', async () => {
    const badContext = { ...context, models: { ...context.models, Customer: undefined } };
    await expect(findAction('getCustomerById')({ context: badContext, customerId: 'c1' })).rejects.toThrow();
    await expect(findAction('getCustomerByStripeId')({ context: badContext, stripeCustomerId: 's1' })).rejects.toThrow();
    await expect(findAction('getCustomersByUser')({ context: badContext, userId: 'u1' })).rejects.toThrow();
    await expect(findAction('listActiveCustomers')({ context: badContext, limit: 1, offset: 0 })).rejects.toThrow();
    await expect(findAction('listDeletedCustomers')({ context: badContext, limit: 1, offset: 0 })).rejects.toThrow();
    await expect(findAction('searchCustomers')({ context: badContext, query: 'foo', limit: 1, offset: 0 })).rejects.toThrow();
    await expect(findAction('getCustomerByEmail')({ context: badContext, email: 'a@example.com' })).rejects.toThrow();
    await expect(findAction('getCustomersByStatus')({ context: badContext, status: 'ACTIVE', limit: 1, offset: 0 })).rejects.toThrow();
  });

  describe('getCustomerById', () => {
    it('returns customer (happy path)', async () => {
      CustomerMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'c1', __v: 0 }) }) });
      const result = await findAction('getCustomerById')({ context, customerId: 'c1' });
      expect(result._id).toBe('c1');
      expect(result.__v).toBeUndefined();
      expect(CustomerMock.findById).toHaveBeenCalledWith('c1');
    });
    it('throws if not found (fail path)', async () => {
      CustomerMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      await expect(findAction('getCustomerById')({ context, customerId: 'bad' })).rejects.toThrow('Customer not found');
    });
    it('throws on invalid input (edge)', async () => {
      await expect(findAction('getCustomerById')({ context })).rejects.toThrow();
    });
  });

  describe('getCustomerByStripeId', () => {
    it('returns customer (happy path)', async () => {
      CustomerMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ stripeCustomerId: 's1', __v: 0 }) }) });
      const result = await findAction('getCustomerByStripeId')({ context, stripeCustomerId: 's1' });
      expect(result.stripeCustomerId).toBe('s1');
      expect(result.__v).toBeUndefined();
      expect(CustomerMock.findOne).toHaveBeenCalledWith({ stripeCustomerId: 's1' });
    });
    it('returns null if not found (edge)', async () => {
      CustomerMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('getCustomerByStripeId')({ context, stripeCustomerId: 'none' });
      expect(result).toBeNull();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getCustomerByStripeId')({ context })).rejects.toThrow();
    });
  });

  describe('getCustomersByUser', () => {
    it('returns customers (happy path)', async () => {
      CustomerMock.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve([{ userId: 'u1', __v: 0 }]) }) });
      const result = await findAction('getCustomersByUser')({ context, userId: 'u1' });
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].userId).toBe('u1');
      expect(result[0].__v).toBeUndefined();
      expect(CustomerMock.find).toHaveBeenCalledWith({ userId: 'u1', deletedAt: null });
    });
    it('returns empty array if none (edge)', async () => {
      CustomerMock.find.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve([]) }) });
      const result = await findAction('getCustomersByUser')({ context, userId: 'none' });
      expect(result).toEqual([]);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getCustomersByUser')({ context })).rejects.toThrow();
    });
  });

  describe('listActiveCustomers', () => {
    it('returns paginated customers (happy path)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'c1', deletedAt: null, __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('listActiveCustomers')({ context, limit: 1, offset: 0 });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].__v).toBeUndefined();
      expect(CustomerMock.countDocuments).toHaveBeenCalledWith({ deletedAt: null });
    });
    it('returns empty if none (edge)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(0);
      const result = await findAction('listActiveCustomers')({ context, limit: 1, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('listActiveCustomers')({ context, limit: -1 })).rejects.toThrow();
    });
  });

  describe('listDeletedCustomers', () => {
    it('returns paginated deleted customers (happy path)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ _id: 'c2', deletedAt: new Date(), __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('listDeletedCustomers')({ context, limit: 1, offset: 0 });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].__v).toBeUndefined();
      expect(CustomerMock.countDocuments).toHaveBeenCalledWith({ deletedAt: { $ne: null } });
    });
    it('returns empty if none (edge)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(0);
      const result = await findAction('listDeletedCustomers')({ context, limit: 1, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('listDeletedCustomers')({ context, limit: -1 })).rejects.toThrow();
    });
  });

  describe('searchCustomers', () => {
    it('returns paginated search results (happy path)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Alice', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'Alice', limit: 1, offset: 0 });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].__v).toBeUndefined();
      expect(CustomerMock.countDocuments).toHaveBeenCalled();
    });
    it('returns empty if none (edge)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(0);
      const result = await findAction('searchCustomers')({ context, query: 'none', limit: 1, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('searchCustomers')({ context })).rejects.toThrow();
    });
    it('should fail validation for missing query', async () => {
      await expect(findAction('searchCustomers')({ context, limit: 1, offset: 0 })).rejects.toThrow();
    });
    it('returns results with status filter (branch: status present)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Bob', status: 'ACTIVE', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'Bob', status: 'ACTIVE', limit: 1, offset: 0 });
      expect(result.items.length).toBe(1);
      expect(result.items[0].status).toBe('ACTIVE');
    });
    it('should fail validation for unknown status', async () => {
      await expect(findAction('searchCustomers')({ context, query: 'Bob', status: 'UNKNOWN', limit: 1, offset: 0 })).rejects.toThrow();
    });
  });

  describe('searchCustomers (branch coverage)', () => {
    it('returns result when only name matches', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Alice', email: 'notmatch@example.com', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'Alice', limit: 1, offset: 0 });
      expect(result.items[0].name).toBe('Alice');
    });
    it('returns result when only email matches', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'NotMatch', email: 'alice@example.com', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'alice@example.com', limit: 1, offset: 0 });
      expect(result.items[0].email).toBe('alice@example.com');
    });
    it('returns multiple results when both name and email match', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([
        { name: 'Alice', email: 'alice@example.com', __v: 0 },
        { name: 'Alice', email: 'other@example.com', __v: 0 }
      ]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(2);
      const result = await findAction('searchCustomers')({ context, query: 'Alice', limit: 2, offset: 0 });
      expect(result.items.length).toBe(2);
    });
    it('returns result with status filter ACTIVE', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Alice', status: 'ACTIVE', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'Alice', status: 'ACTIVE', limit: 1, offset: 0 });
      expect(result.items[0].status).toBe('ACTIVE');
    });
    it('returns result with status filter DELETED', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Alice', status: 'DELETED', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'Alice', status: 'DELETED', limit: 1, offset: 0 });
      expect(result.items[0].status).toBe('DELETED');
    });
    it('returns result with status filter SUSPENDED', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ name: 'Alice', status: 'SUSPENDED', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('searchCustomers')({ context, query: 'Alice', status: 'SUSPENDED', limit: 1, offset: 0 });
      expect(result.items[0].status).toBe('SUSPENDED');
    });
  });

  describe('getCustomerByEmail', () => {
    it('returns customer (happy path)', async () => {
      CustomerMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ email: 'a@example.com', __v: 0 }) }) });
      const result = await findAction('getCustomerByEmail')({ context, email: 'a@example.com' });
      expect(result.email).toBe('a@example.com');
      expect(result.__v).toBeUndefined();
      expect(CustomerMock.findOne).toHaveBeenCalledWith({ email: 'a@example.com' });
    });
    it('returns null if not found (edge)', async () => {
      CustomerMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const result = await findAction('getCustomerByEmail')({ context, email: 'none@example.com' });
      expect(result).toBeNull();
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getCustomerByEmail')({ context })).rejects.toThrow();
    });
    it('should fail validation for invalid email', async () => {
      await expect(findAction('getCustomerByEmail')({ context, email: 'not-an-email' })).rejects.toThrow();
    });
  });

  describe('getCustomersByStatus', () => {
    it('returns paginated customers by status (happy path)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ status: 'ACTIVE', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const result = await findAction('getCustomersByStatus')({ context, status: 'ACTIVE', limit: 1, offset: 0 });
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].status).toBe('ACTIVE');
      expect(result.items[0].__v).toBeUndefined();
      expect(CustomerMock.countDocuments).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
    it('returns empty if none (edge)', async () => {
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(0);
      const result = await findAction('getCustomersByStatus')({ context, status: 'ACTIVE', limit: 1, offset: 0 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('throws on invalid input (fail)', async () => {
      await expect(findAction('getCustomersByStatus')({ context })).rejects.toThrow();
    });
    it('should fail validation for unknown status', async () => {
      await expect(findAction('getCustomersByStatus')({ context, status: 'UNKNOWN', limit: 1, offset: 0 })).rejects.toThrow();
    });
    it('returns results with and without status (branch: status present/absent)', async () => {
      // With status
      CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ status: 'ACTIVE', __v: 0 }]) }) }) }) }) });
      CustomerMock.countDocuments.mockResolvedValueOnce(1);
      const withStatus = await findAction('getCustomersByStatus')({ context, status: 'ACTIVE', limit: 1, offset: 0 });
      expect(withStatus.items[0].status).toBe('ACTIVE');
      // Without status (should fail validation)
      await expect(findAction('getCustomersByStatus')({ context, limit: 1, offset: 0 })).rejects.toThrow();
    });
  });

  describe('getCustomersByStatus (branch coverage)', () => {
    ['ACTIVE', 'DELETED', 'SUSPENDED'].forEach(status => {
      it(`returns customers with status ${status}`, async () => {
        CustomerMock.find.mockReturnValueOnce({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([{ status, __v: 0 }]) }) }) }) }) });
        CustomerMock.countDocuments.mockResolvedValueOnce(1);
        const result = await findAction('getCustomersByStatus')({ context, status, limit: 1, offset: 0 });
        expect(result.items[0].status).toBe(status);
      });
    });
  });

  it('should compose: fetch by ID then by email', async () => {
    CustomerMock.findById.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ _id: 'c1', email: 'a@example.com', __v: 0 }) }) });
    CustomerMock.findOne.mockReturnValueOnce({ lean: () => ({ exec: () => Promise.resolve({ email: 'a@example.com', __v: 0 }) }) });
    const byId = await findAction('getCustomerById')({ context, customerId: 'c1' });
    const byEmail = await findAction('getCustomerByEmail')({ context, email: byId.email });
    expect(byEmail.email).toBe('a@example.com');
  });
}); 