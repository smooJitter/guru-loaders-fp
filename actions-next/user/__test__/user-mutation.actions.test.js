import { jest } from '@jest/globals';
import userMutation from '../user-mutation.actions.js';

const mockContext = {
  services: { db: {}, pubsub: {} },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('userMutation', () => {
  const createUser = userMutation.find(a => a.name === 'createUser').method;
  const updateUser = userMutation.find(a => a.name === 'updateUser').method;
  const markUserDeleted = userMutation.find(a => a.name === 'markUserDeleted').method;
  const recordLogin = userMutation.find(a => a.name === 'recordLogin').method;

  test('createUser: happy path', async () => {
    const mockSave = jest.fn().mockResolvedValue({ toObject: () => ({ email: 'a@b.com', status: 'active' }) });
    const mockUser = function (data) { Object.assign(this, data); };
    mockUser.prototype.save = mockSave;
    const mockModels = { User: mockUser };
    const context = { ...mockContext, models: mockModels };
    const result = await createUser({ context, email: 'a@b.com' });
    expect(result).toEqual({ email: 'a@b.com', status: 'active' });
    expect(mockSave).toHaveBeenCalled();
  });
  test('createUser: missing email throws', async () => {
    const mockUser = function () {};
    mockUser.prototype.save = jest.fn();
    const context = { ...mockContext, models: { User: mockUser } };
    await expect(createUser({ context })).rejects.toThrow('Invalid input');
  });

  test('updateUser: happy path', async () => {
    const updated = { _id: 'u1', name: 'Bob' };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUser = { findByIdAndUpdate: mockFindByIdAndUpdate };
    const context = { ...mockContext, models: { User: mockUser } };
    const result = await updateUser({ context, id: 'u1', updates: { name: 'Bob' } });
    expect(result).toEqual(updated);
  });
  test('updateUser: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUser = { findByIdAndUpdate: mockFindByIdAndUpdate };
    const context = { ...mockContext, models: { User: mockUser } };
    const result = await updateUser({ context, id: 'u1', updates: { name: 'Bob' } });
    expect(result).toBeNull();
  });
  test('updateUser: missing id throws', async () => {
    const context = { ...mockContext, models: { User: {} } };
    await expect(updateUser({ context, id: null, updates: {} })).rejects.toThrow('Invalid input');
  });

  test('markUserDeleted: happy path', async () => {
    const updated = { _id: 'u1', status: 'deleted' };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUser = { findByIdAndUpdate: mockFindByIdAndUpdate };
    const context = { ...mockContext, models: { User: mockUser } };
    const result = await markUserDeleted({ context, id: 'u1' });
    expect(result).toEqual(updated);
  });
  test('markUserDeleted: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUser = { findByIdAndUpdate: mockFindByIdAndUpdate };
    const context = { ...mockContext, models: { User: mockUser } };
    const result = await markUserDeleted({ context, id: 'u1' });
    expect(result).toBeNull();
  });

  test('recordLogin: happy path', async () => {
    const updated = { _id: 'u1', status: 'active', lastLogin: new Date() };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUser = { findByIdAndUpdate: mockFindByIdAndUpdate };
    const context = { ...mockContext, models: { User: mockUser } };
    const result = await recordLogin({ context, id: 'u1' });
    expect(result).toEqual(updated);
  });
  test('recordLogin: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUser = { findByIdAndUpdate: mockFindByIdAndUpdate };
    const context = { ...mockContext, models: { User: mockUser } };
    const result = await recordLogin({ context, id: 'u1' });
    expect(result).toBeNull();
  });
}); 