import { jest } from '@jest/globals';
import userQuery from '../user-query.actions.js';

const mockContext = {
  services: { db: {}, pubsub: {} },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('userQuery', () => {
  const getUserById = userQuery.find(a => a.name === 'getUserById').method;
  const getUserByEmail = userQuery.find(a => a.name === 'getUserByEmail').method;
  const listUsers = userQuery.find(a => a.name === 'listUsers').method;
  const searchUsers = userQuery.find(a => a.name === 'searchUsers').method;

  test('getUserById: happy path', async () => {
    const mockUser = { _id: 'u1', email: 'a@b.com' };
    const mockExec = jest.fn().mockResolvedValue(mockUser);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindById = jest.fn(() => ({ lean: mockLean }));
    const mockUserModel = { findById: mockFindById };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await getUserById({ context, id: 'u1' });
    expect(result).toEqual(mockUser);
  });
  test('getUserById: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindById = jest.fn(() => ({ lean: mockLean }));
    const mockUserModel = { findById: mockFindById };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await getUserById({ context, id: 'u1' });
    expect(result).toBeNull();
  });
  test('getUserById: missing id throws', async () => {
    const context = { ...mockContext, models: { User: {} } };
    await expect(getUserById({ context, id: null })).rejects.toThrow('Invalid input');
  });

  test('getUserByEmail: happy path', async () => {
    const mockUser = { _id: 'u1', email: 'a@b.com' };
    const mockExec = jest.fn().mockResolvedValue(mockUser);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOne = jest.fn(() => ({ lean: mockLean }));
    const mockUserModel = { findOne: mockFindOne };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await getUserByEmail({ context, email: 'a@b.com' });
    expect(result).toEqual(mockUser);
  });
  test('getUserByEmail: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOne = jest.fn(() => ({ lean: mockLean }));
    const mockUserModel = { findOne: mockFindOne };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await getUserByEmail({ context, email: 'a@b.com' });
    expect(result).toBeNull();
  });
  test('getUserByEmail: missing email throws', async () => {
    const context = { ...mockContext, models: { User: {} } };
    await expect(getUserByEmail({ context, email: null })).rejects.toThrow('Invalid input');
  });

  test('listUsers: happy path', async () => {
    const mockUsers = [{ _id: 'u1' }, { _id: 'u2' }];
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(mockUsers) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(2);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await listUsers({ context, limit: 2, offset: 0, filters: {} });
    expect(result.items).toEqual(mockUsers);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  test('listUsers: empty result', async () => {
    const mockUsers = [];
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(mockUsers) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(0);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await listUsers({ context, limit: 2, offset: 0, filters: {} });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
  test('listUsers: hasMore true', async () => {
    const mockUsers = [{ _id: 'u1' }, { _id: 'u2' }];
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(mockUsers) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(5);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await listUsers({ context, limit: 2, offset: 0, filters: {} });
    expect(result.hasMore).toBe(true);
  });
  test('listUsers: malformed Promise.all result', async () => {
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(undefined) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(undefined);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await listUsers({ context, limit: 2, offset: 0, filters: {} });
    expect(result.items).toEqual([undefined]);
    expect(result.total).toBe(undefined);
    expect(result.hasMore).toBe(false);
  });

  test('searchUsers: happy path', async () => {
    const mockUsers = [{ _id: 'u1', email: 'a@b.com' }];
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(mockUsers) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(1);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await searchUsers({ context, query: 'a@b.com', limit: 1, offset: 0 });
    expect(result.items).toEqual(mockUsers);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
  });
  test('searchUsers: missing query throws', async () => {
    const context = { ...mockContext, models: { User: {} } };
    await expect(searchUsers({ context, query: null })).rejects.toThrow('Invalid input');
  });
  test('searchUsers: empty result', async () => {
    const mockUsers = [];
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(mockUsers) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(0);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await searchUsers({ context, query: 'a@b.com', limit: 1, offset: 0 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
  test('searchUsers: hasMore true', async () => {
    const mockUsers = [{ _id: 'u1' }, { _id: 'u2' }];
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(mockUsers) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(5);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await searchUsers({ context, query: 'a@b.com', limit: 2, offset: 0 });
    expect(result.hasMore).toBe(true);
  });
  test('searchUsers: malformed Promise.all result', async () => {
    const mockFind = jest.fn(() => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(undefined) }) }) }) }));
    const mockCountDocuments = jest.fn().mockResolvedValue(undefined);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    const result = await searchUsers({ context, query: 'a@b.com', limit: 2, offset: 0 });
    expect(result.items).toEqual([undefined]);
    expect(result.total).toBe(undefined);
    expect(result.hasMore).toBe(false);
  });
  test('searchUsers: User.find throws', async () => {
    const mockFind = jest.fn(() => { throw new Error('DB error'); });
    const mockCountDocuments = jest.fn().mockResolvedValue(0);
    const mockUserModel = { find: mockFind, countDocuments: mockCountDocuments };
    const context = { ...mockContext, models: { User: mockUserModel } };
    await expect(searchUsers({ context, query: 'a@b.com', limit: 2, offset: 0 })).rejects.toThrow('DB error');
  });
}); 