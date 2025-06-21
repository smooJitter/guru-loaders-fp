import { jest } from '@jest/globals';
// Import action modules
import * as userProfileMutation from '../user/user-profile-mutation.actions.js';
import * as userProfileQuery from '../user/user-profile-query.actions.js';
import * as userAccountQuery from '../user/user-account-query.actions.js';
import * as userMutation from '../user/user-mutation.actions.js';
import * as userQuery from '../user/user-query.actions.js';
import * as userAccountMutation from '../user/user-account-mutation.actions.js';

// Mock context and services
const mockContext = {
  services: {
    db: {},
    pubsub: {},
    // ...add other services as needed
  },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('User Actions', () => {
  describe('userProfileMutation', () => {
    const createProfile = userProfileMutation.default.find(a => a.name === 'createProfile').method;

    test('happy path: creates a profile', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        toObject: () => ({ userId: 'u1', tenantId: 't1', name: 'Alice' })
      });
      const mockUserProfile = function (data) { Object.assign(this, data); };
      mockUserProfile.prototype.save = mockSave;
      const mockModels = { UserProfile: mockUserProfile };
      const context = { ...mockContext, models: mockModels };
      const result = await createProfile({ context, userId: 'u1', tenantId: 't1', name: 'Alice' });
      expect(result).toEqual({ userId: 'u1', tenantId: 't1', name: 'Alice' });
      expect(mockSave).toHaveBeenCalled();
    });

    test('failure path: missing userId or tenantId throws', async () => {
      const context = { ...mockContext, models: { UserProfile: jest.fn() } };
      await expect(createProfile({ context, userId: null, tenantId: 't1', name: 'Alice' }))
        .rejects.toThrow('Invalid input');
      await expect(createProfile({ context, userId: 'u1', tenantId: null, name: 'Alice' }))
        .rejects.toThrow('Invalid input');
    });

    test('edge case', async () => {
      // TODO: Edge condition test
    });
    test('failure path', async () => {
      // TODO: Simulate failure (e.g., unauthorized)
    });
  });

  describe('userProfileQuery', () => {
    const getProfileByUserId = userProfileQuery.default.find(a => a.name === 'getProfileByUserId').method;
    test('happy path: gets profile by userId', async () => {
      const mockProfile = { userId: 'u1', name: 'Alice' };
      const mockExec = jest.fn().mockResolvedValue(mockProfile);
      const mockLean = jest.fn(() => ({ exec: mockExec }));
      const mockFindOne = jest.fn(() => ({ lean: mockLean }));
      const mockUserProfile = { findOne: mockFindOne };
      const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
      const result = await getProfileByUserId({ context, userId: 'u1' });
      expect(result).toEqual(mockProfile);
      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'u1' });
    });
    test('failure path: missing userId throws', async () => {
      const context = { ...mockContext, models: { UserProfile: {} } };
      await expect(getProfileByUserId({ context, userId: null })).rejects.toThrow('Invalid input');
    });
  });

  describe('userAccountQuery', () => {
    const getAccountByUserId = userAccountQuery.default.find(a => a.name === 'getAccountByUserId').method;
    test('happy path: gets account by userId', async () => {
      const mockAccount = { userId: 'u1', balance: 100 };
      const mockExec = jest.fn().mockResolvedValue(mockAccount);
      const mockLean = jest.fn(() => ({ exec: mockExec }));
      const mockFindOne = jest.fn(() => ({ lean: mockLean }));
      const mockUserAccount = { findOne: mockFindOne };
      const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
      const result = await getAccountByUserId({ context, userId: 'u1' });
      expect(result).toEqual(mockAccount);
      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'u1' });
    });
    test('failure path: missing userId throws', async () => {
      const context = { ...mockContext, models: { UserAccount: {} } };
      await expect(getAccountByUserId({ context, userId: null })).rejects.toThrow('Invalid input');
    });
  });

  describe('userMutation', () => {
    const createUser = userMutation.default.find(a => a.name === 'createUser').method;
    test('happy path: creates a user', async () => {
      const mockSave = jest.fn().mockResolvedValue({ toObject: () => ({ email: 'a@b.com', status: 'active' }) });
      const mockUser = function (data) { Object.assign(this, data); };
      mockUser.prototype.save = mockSave;
      const mockModels = { User: mockUser };
      const context = { ...mockContext, models: mockModels };
      const result = await createUser({ context, email: 'a@b.com' });
      expect(result).toEqual({ email: 'a@b.com', status: 'active' });
      expect(mockSave).toHaveBeenCalled();
    });
    test('failure path: missing email throws', async () => {
      const mockUser = function () {};
      mockUser.prototype.save = jest.fn();
      const context = { ...mockContext, models: { User: mockUser } };
      await expect(createUser({ context })).rejects.toThrow('Invalid input');
    });
  });

  describe('userQuery', () => {
    const getUserById = userQuery.default.find(a => a.name === 'getUserById').method;
    test('happy path: gets user by id', async () => {
      const mockUser = { _id: 'u1', email: 'a@b.com' };
      const mockExec = jest.fn().mockResolvedValue(mockUser);
      const mockLean = jest.fn(() => ({ exec: mockExec }));
      const mockFindById = jest.fn(() => ({ lean: mockLean }));
      const mockUserModel = { findById: mockFindById };
      const context = { ...mockContext, models: { User: mockUserModel } };
      const result = await getUserById({ context, id: 'u1' });
      expect(result).toEqual(mockUser);
      expect(mockFindById).toHaveBeenCalledWith('u1');
    });
    test('failure path: missing id throws', async () => {
      const context = { ...mockContext, models: { User: {} } };
      await expect(getUserById({ context, id: null })).rejects.toThrow('Invalid input');
    });
  });

  describe('userAccountMutation', () => {
    const createAccount = userAccountMutation.default.find(a => a.name === 'createAccount').method;
    test('happy path: creates an account', async () => {
      const mockSave = jest.fn().mockResolvedValue({ toObject: () => ({ userId: 'u1', tenantId: 't1', roles: ['admin'] }) });
      const mockUserAccount = function (data) { Object.assign(this, data); };
      mockUserAccount.prototype.save = mockSave;
      const mockModels = { UserAccount: mockUserAccount };
      const context = { ...mockContext, models: mockModels };
      const result = await createAccount({ context, userId: 'u1', tenantId: 't1', roles: ['admin'] });
      expect(result).toEqual({ userId: 'u1', tenantId: 't1', roles: ['admin'] });
      expect(mockSave).toHaveBeenCalled();
    });
    test('failure path: missing userId/tenantId throws', async () => {
      const mockUserAccount = function () {};
      mockUserAccount.prototype.save = jest.fn();
      const context = { ...mockContext, models: { UserAccount: mockUserAccount } };
      await expect(createAccount({ context, userId: null, tenantId: 't1' })).rejects.toThrow('Invalid input');
      await expect(createAccount({ context, userId: 'u1', tenantId: null })).rejects.toThrow('Invalid input');
    });
  });
}); 