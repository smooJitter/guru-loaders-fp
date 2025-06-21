import { jest } from '@jest/globals';
import userAccountMutation from '../user-account-mutation.actions.js';

const mockContext = {
  services: { db: {}, pubsub: {} },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('userAccountMutation', () => {
  const createAccount = userAccountMutation.find(a => a.name === 'createAccount').method;
  const updatePreferences = userAccountMutation.find(a => a.name === 'updatePreferences').method;
  const assignRoles = userAccountMutation.find(a => a.name === 'assignRoles').method;
  const addBadge = userAccountMutation.find(a => a.name === 'addBadge').method;
  const adjustReputation = userAccountMutation.find(a => a.name === 'adjustReputation').method;

  test('createAccount: happy path', async () => {
    const mockSave = jest.fn().mockResolvedValue({ toObject: () => ({ userId: 'u1', tenantId: 't1', roles: ['admin'] }) });
    const mockUserAccount = function (data) { Object.assign(this, data); };
    mockUserAccount.prototype.save = mockSave;
    const mockModels = { UserAccount: mockUserAccount };
    const context = { ...mockContext, models: mockModels };
    const result = await createAccount({ context, userId: 'u1', tenantId: 't1', roles: ['admin'] });
    expect(result).toEqual({ userId: 'u1', tenantId: 't1', roles: ['admin'] });
    expect(mockSave).toHaveBeenCalled();
  });
  test('createAccount: missing userId/tenantId throws', async () => {
    const mockUserAccount = function () {};
    mockUserAccount.prototype.save = jest.fn();
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    await expect(createAccount({ context, userId: null, tenantId: 't1' })).rejects.toThrow('Invalid input');
    await expect(createAccount({ context, userId: 'u1', tenantId: null })).rejects.toThrow('Invalid input');
  });

  test('updatePreferences: happy path', async () => {
    const updated = { userId: 'u1', preferences: { theme: 'dark' } };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await updatePreferences({ context, userId: 'u1', prefs: { theme: 'dark' } });
    expect(result).toEqual(updated);
  });
  test('updatePreferences: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await updatePreferences({ context, userId: 'u1', prefs: { theme: 'dark' } });
    expect(result).toBeNull();
  });
  test('updatePreferences: missing userId/prefs throws', async () => {
    const context = { ...mockContext, models: { UserAccount: {} } };
    await expect(updatePreferences({ context, userId: null, prefs: { theme: 'dark' } })).rejects.toThrow('Invalid input');
    await expect(updatePreferences({ context, userId: 'u1', prefs: null })).rejects.toThrow('Invalid input');
  });

  test('assignRoles: happy path', async () => {
    const updated = { userId: 'u1', roles: ['admin'] };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await assignRoles({ context, userId: 'u1', roles: ['admin'] });
    expect(result).toEqual(updated);
  });
  test('assignRoles: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await assignRoles({ context, userId: 'u1', roles: ['admin'] });
    expect(result).toBeNull();
  });
  test('assignRoles: missing userId/roles throws', async () => {
    const context = { ...mockContext, models: { UserAccount: {} } };
    await expect(assignRoles({ context, userId: null, roles: ['admin'] })).rejects.toThrow('Invalid input');
    await expect(assignRoles({ context, userId: 'u1', roles: null })).rejects.toThrow('Invalid input');
  });
  test('assignRoles: invalid role throws', async () => {
    const mockExec = jest.fn().mockResolvedValue({});
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    await expect(assignRoles({ context, userId: 'u1', roles: ['notarole'] })).rejects.toThrow('Invalid role: notarole');
  });

  test('addBadge: happy path', async () => {
    const updated = { userId: 'u1', badges: ['gold'] };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await addBadge({ context, userId: 'u1', badge: 'gold' });
    expect(result).toEqual(updated);
  });
  test('addBadge: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await addBadge({ context, userId: 'u1', badge: 'gold' });
    expect(result).toBeNull();
  });
  test('addBadge: missing userId/badge throws', async () => {
    const context = { ...mockContext, models: { UserAccount: {} } };
    await expect(addBadge({ context, userId: null, badge: 'gold' })).rejects.toThrow('Invalid input');
    await expect(addBadge({ context, userId: 'u1', badge: null })).rejects.toThrow('Invalid input');
  });

  test('adjustReputation: happy path', async () => {
    const updated = { userId: 'u1', reputation: 10 };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await adjustReputation({ context, userId: 'u1', delta: 10 });
    expect(result).toEqual(updated);
  });
  test('adjustReputation: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserAccount = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
    const result = await adjustReputation({ context, userId: 'u1', delta: 10 });
    expect(result).toBeNull();
  });
  test('adjustReputation: missing userId/delta throws', async () => {
    const context = { ...mockContext, models: { UserAccount: {} } };
    await expect(adjustReputation({ context, userId: null, delta: 10 })).rejects.toThrow('Invalid input');
    await expect(adjustReputation({ context, userId: 'u1', delta: undefined })).rejects.toThrow('Invalid input');
  });
}); 