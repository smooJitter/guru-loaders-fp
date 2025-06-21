import { jest } from '@jest/globals';
import userProfileMutation from '../user-profile-mutation.actions.js';

const mockContext = {
  services: { db: {}, pubsub: {} },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('userProfileMutation', () => {
  const createProfile = userProfileMutation.find(a => a.name === 'createProfile').method;

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
});

const updateProfile = userProfileMutation.find(a => a.name === 'updateProfile').method;
const updateVisibility = userProfileMutation.find(a => a.name === 'updateVisibility').method;
const updateSocialLinks = userProfileMutation.find(a => a.name === 'updateSocialLinks').method;
const updateProfileWithPlugin = userProfileMutation.find(a => a.name === 'updateProfileWithPlugin').method;

describe('updateProfile', () => {
  test('happy path: updates profile', async () => {
    const updated = { userId: 'u1', name: 'Bob' };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await updateProfile({ context, userId: 'u1', updates: { name: 'Bob' } });
    expect(result).toEqual(updated);
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
  });
  test('edge case: returns null if not found', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await updateProfile({ context, userId: 'u1', updates: { name: 'Bob' } });
    expect(result).toBeNull();
  });
  test('failure path: missing userId throws', async () => {
    const context = { ...mockContext, models: { UserProfile: {} } };
    await expect(updateProfile({ context, userId: null, updates: {} })).rejects.toThrow('Invalid input');
  });
});

describe('updateVisibility', () => {
  test('happy path: updates visibility', async () => {
    const updated = { userId: 'u1', visibility: 'public' };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await updateVisibility({ context, userId: 'u1', visibility: 'public' });
    expect(result).toEqual(updated);
  });
  test('edge case: returns null if not found', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await updateVisibility({ context, userId: 'u1', visibility: 'public' });
    expect(result).toBeNull();
  });
  test('failure path: missing userId or visibility throws', async () => {
    const context = { ...mockContext, models: { UserProfile: {} } };
    await expect(updateVisibility({ context, userId: null, visibility: 'public' })).rejects.toThrow('Invalid input');
    await expect(updateVisibility({ context, userId: 'u1', visibility: null })).rejects.toThrow('Invalid input');
  });
});

describe('updateSocialLinks', () => {
  test('happy path: updates social links', async () => {
    const updated = { userId: 'u1', social: ['twitter'] };
    const mockExec = jest.fn().mockResolvedValue(updated);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await updateSocialLinks({ context, userId: 'u1', links: ['twitter'] });
    expect(result).toEqual(updated);
  });
  test('edge case: returns null if not found', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOneAndUpdate = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOneAndUpdate: mockFindOneAndUpdate };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await updateSocialLinks({ context, userId: 'u1', links: ['twitter'] });
    expect(result).toBeNull();
  });
  test('failure path: missing userId or links throws', async () => {
    const context = { ...mockContext, models: { UserProfile: {} } };
    await expect(updateSocialLinks({ context, userId: null, links: ['twitter'] })).rejects.toThrow('Invalid input');
    await expect(updateSocialLinks({ context, userId: 'u1', links: null })).rejects.toThrow('Invalid input');
  });
});

describe('updateProfileWithPlugin', () => {
  test('happy path: updates profile and uses plugin', async () => {
    const mockProfile = { userId: 'u1', save: jest.fn().mockResolvedValue(), toObject: () => ({ userId: 'u1', updatedAt: expect.any(Date) }) };
    const mockFindOne = jest.fn().mockResolvedValue(mockProfile);
    const mockUserProfile = { findOne: mockFindOne };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const pluginMethods = { setUpdatedAt: jest.fn() };
    const getPluginMethods = () => pluginMethods;
    const updateProfileWithPlugin = userProfileMutation.find(a => a.name === 'updateProfileWithPlugin').method;
    const result = await updateProfileWithPlugin({ context, userId: 'u1', updates: { name: 'Bob' }, getPluginMethods });
    expect(result.userId).toBe('u1');
    expect(pluginMethods.setUpdatedAt).toHaveBeenCalled();
    expect(mockProfile.save).toHaveBeenCalled();
  });
  test('edge case: returns null if profile not found', async () => {
    const mockFindOne = jest.fn().mockResolvedValue(null);
    const mockUserProfile = { findOne: mockFindOne };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const getPluginMethods = () => ({ setUpdatedAt: jest.fn() });
    const updateProfileWithPlugin = userProfileMutation.find(a => a.name === 'updateProfileWithPlugin').method;
    const result = await updateProfileWithPlugin({ context, userId: 'u1', updates: { name: 'Bob' }, getPluginMethods });
    expect(result).toBeNull();
  });
  test('failure path: missing userId throws', async () => {
    const context = { ...mockContext, models: { UserProfile: {} } };
    const getPluginMethods = () => ({ setUpdatedAt: jest.fn() });
    const updateProfileWithPlugin = userProfileMutation.find(a => a.name === 'updateProfileWithPlugin').method;
    await expect(updateProfileWithPlugin({ context, userId: null, updates: {}, getPluginMethods })).rejects.toThrow('Invalid input');
  });
});

describe('updateProfileWithPlugin (fallback branch)', () => {
  test('fallback: updates updatedAt directly if no plugin', async () => {
    // Use a plain object so updatedAt can be set
    const mockProfile = {
      userId: 'u1',
      updatedAt: undefined,
      save: jest.fn().mockResolvedValue(),
      toObject: () => ({ userId: 'u1', updatedAt: mockProfile.updatedAt })
    };
    const mockFindOne = jest.fn().mockResolvedValue(mockProfile);
    const mockUserProfile = { findOne: mockFindOne };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const getPluginMethods = () => null;
    const updateProfileWithPlugin = userProfileMutation.find(a => a.name === 'updateProfileWithPlugin').method;
    const result = await updateProfileWithPlugin({ context, userId: 'u1', updates: { name: 'Bob' }, getPluginMethods });
    expect(result.userId).toBe('u1');
    expect(mockProfile.updatedAt).toBeInstanceOf(Date);
    expect(mockProfile.save).toHaveBeenCalled();
  });
}); 