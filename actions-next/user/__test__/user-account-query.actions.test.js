import { jest } from '@jest/globals';
import userAccountQuery from '../user-account-query.actions.js';

const mockContext = {
  services: { db: {}, pubsub: {} },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('userAccountQuery', () => {
  const getAccountByUserId = userAccountQuery.find(a => a.name === 'getAccountByUserId').method;
  const count = userAccountQuery.find(a => a.name === 'count').method;
  const sumField = userAccountQuery.find(a => a.name === 'sumField').method;
  const groupBy = userAccountQuery.find(a => a.name === 'groupBy').method;
  const distinct = userAccountQuery.find(a => a.name === 'distinct').method;
  const aggregate = userAccountQuery.find(a => a.name === 'aggregate').method;
  const facetedStats = userAccountQuery.find(a => a.name === 'facetedStats').method;
  const countByDay = userAccountQuery.find(a => a.name === 'countByDay').method;
  const topN = userAccountQuery.find(a => a.name === 'topN').method;

  test('getAccountByUserId: happy path', async () => {
    const mockAccount = { userId: 'u1', balance: 100 };
    const mockExec = jest.fn().mockResolvedValue(mockAccount);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOne = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOne: mockFindOne };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await getAccountByUserId({ context, userId: 'u1' });
    expect(result).toEqual(mockAccount);
  });
  test('getAccountByUserId: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOne = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOne: mockFindOne };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await getAccountByUserId({ context, userId: 'u1' });
    expect(result).toBeNull();
  });
  test('getAccountByUserId: missing userId throws', async () => {
    const context = { ...mockContext, models: { UserAccount: {} } };
    await expect(getAccountByUserId({ context, userId: null })).rejects.toThrow('Invalid input');
  });

  test('count: happy path', async () => {
    const mockCount = jest.fn().mockResolvedValue(42);
    const mockUserAccount = { countDocuments: mockCount };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await count({ context, filter: { foo: 'bar' } });
    expect(result).toBe(42);
    expect(mockCount).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('sumField: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ total: 99 }]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await sumField({ context, field: 'score', filter: { foo: 'bar' } });
    expect(result).toBe(99);
  });
  test('sumField: no result returns 0', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await sumField({ context, field: 'score', filter: { foo: 'bar' } });
    expect(result).toBe(0);
  });
  test('sumField: result is [{}] returns 0', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{}]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await sumField({ context, field: 'score', filter: { foo: 'bar' } });
    expect(result).toBe(0);
  });
  test('sumField: result is undefined returns 0', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await sumField({ context, field: 'score', filter: { foo: 'bar' } });
    expect(result).toBe(0);
  });

  test('groupBy: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: 'admin', count: 2 }]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await groupBy({ context, groupField: 'roles', filter: {} });
    expect(result).toEqual([{ _id: 'admin', count: 2 }]);
  });
  test('groupBy: empty result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await groupBy({ context, groupField: 'roles', filter: {} });
    expect(result).toEqual([]);
  });

  test('distinct: happy path', async () => {
    const mockDistinct = jest.fn().mockResolvedValue(['admin', 'user']);
    const mockUserAccount = { distinct: mockDistinct };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await distinct({ context, field: 'roles', filter: {} });
    expect(result).toEqual(['admin', 'user']);
  });

  test('aggregate: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ foo: 1 }]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await aggregate({ context, pipeline: [{ $match: {} }] });
    expect(result).toEqual([{ foo: 1 }]);
  });

  test('facetedStats: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ byStatus: [], byRole: [] }]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await facetedStats({ context, filter: {} });
    expect(result).toEqual([{ byStatus: [], byRole: [] }]);
  });
  test('facetedStats: empty result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await facetedStats({ context, filter: {} });
    expect(result).toEqual([]);
  });

  test('countByDay: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: '2024-01-01', count: 5 }]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await countByDay({ context, filter: {} });
    expect(result).toEqual([{ _id: '2024-01-01', count: 5 }]);
  });
  test('countByDay: empty result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await countByDay({ context, filter: {} });
    expect(result).toEqual([]);
  });

  test('topN: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: 'admin', count: 3 }]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await topN({ context, field: 'roles', limit: 1, filter: {} });
    expect(result).toEqual([{ _id: 'admin', count: 3 }]);
  });
  test('topN: empty result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await topN({ context, field: 'roles', limit: 1, filter: {} });
    expect(result).toEqual([]);
  });

  test('distinct: undefined result', async () => {
    const mockDistinct = jest.fn().mockResolvedValue(undefined);
    const mockUserAccount = { distinct: mockDistinct };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await distinct({ context, field: 'roles', filter: {} });
    expect(result).toBeUndefined();
  });
  test('aggregate: undefined result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await aggregate({ context, pipeline: [{ $match: {} }] });
    expect(result).toBeUndefined();
  });
  test('facetedStats: undefined result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await facetedStats({ context, filter: {} });
    expect(result).toBeUndefined();
  });
  test('countByDay: undefined result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await countByDay({ context, filter: {} });
    expect(result).toBeUndefined();
  });
  test('topN: undefined result', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await topN({ context, field: 'roles', limit: 1, filter: {} });
    expect(result).toBeUndefined();
  });
  test('groupBy: throws error', async () => {
    const mockAggregate = jest.fn().mockRejectedValue(new Error('DB error'));
    const mockUserAccount = { aggregate: mockAggregate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    await expect(groupBy({ context, groupField: 'roles', filter: {} })).rejects.toThrow('DB error');
  });
}); 