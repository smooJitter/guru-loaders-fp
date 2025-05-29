import { createAuthLoader } from '../auth-loader.js';
import { jest } from '@jest/globals';

describe('Auth Loader', () => {
  let authLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        auth: {
          authenticate: jest.fn(),
          authorize: jest.fn(),
          hasRole: jest.fn(),
          hasAnyRole: jest.fn(),
          hasPermission: jest.fn(),
          hasAnyPermission: jest.fn(),
          createSession: jest.fn(),
          validateSession: jest.fn(),
          destroySession: jest.fn(),
        },
        logger: {
          error: jest.fn(),
        },
      },
    };
    authLoader = createAuthLoader();
  });

  test('should validate auth module correctly', () => {
    const validModule = {
      name: 'userAuth',
      roles: { ADMIN: { permissions: ['read:all'] } },
      guards: { isAdmin: jest.fn() },
    };
    expect(authLoader.validate(validModule)).toBe(true);
  });

  test('should transform auth module correctly', () => {
    const module = {
      name: 'userAuth',
      roles: { ADMIN: { permissions: ['read:all'] } },
      guards: { isAdmin: jest.fn() },
    };
    const transformed = authLoader.transform(module);
    expect(transformed.name).toBe('userAuth');
    expect(transformed.roles.ADMIN.permissions).toContain('read:all');
  });

  test('should create auth instance correctly', async () => {
    const module = {
      name: 'userAuth',
      roles: { ADMIN: { permissions: ['read:all'] } },
      guards: { isAdmin: jest.fn() },
    };
    const instance = await authLoader.create(mockContext);
    expect(instance.authenticate).toBeDefined();
    expect(instance.authorize).toBeDefined();
  });
}); 