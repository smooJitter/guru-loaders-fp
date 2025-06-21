import { jest } from '@jest/globals';
import userProfileQuery from '../user-profile-query.actions.js';

const mockContext = {
  services: { db: {}, pubsub: {} },
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
};

describe('userProfileQuery', () => {
  const getProfileByUserId = userProfileQuery.find(a => a.name === 'getProfileByUserId').method;
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
  test('edge case: returns null if not found', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindOne = jest.fn(() => ({ lean: mockLean }));
    const mockUserProfile = { findOne: mockFindOne };
    const context = { ...mockContext, models: { UserProfile: mockUserProfile } };
    const result = await getProfileByUserId({ context, userId: 'u1' });
    expect(result).toBeNull();
  });
  test('failure path: missing userId throws', async () => {
    const context = { ...mockContext, models: { UserProfile: {} } };
    await expect(getProfileByUserId({ context, userId: null })).rejects.toThrow('Invalid input');
  });
}); 