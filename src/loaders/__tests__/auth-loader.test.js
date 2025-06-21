import { createAuthLoader } from '../auth-loader.js';

function mockLogger() {
  const calls = { error: [], warn: [], info: [] };
  return {
    error: (...args) => calls.error.push(args),
    warn: (...args) => calls.warn.push(args),
    info: (...args) => calls.info.push(args),
    calls,
  };
}

function mockContext(overrides = {}) {
  // Always provide logger as context.services.logger
  return { services: { logger: overrides.logger || mockLogger() }, ...overrides };
}

describe('auth-loader', () => {
  test('loads valid auth module (object export)', async () => {
    const logger = mockLogger();
    const validAuth = { name: 'default', roles: {}, guards: {}, options: {} };
    const loader = createAuthLoader({
      importAndApplyAll: async () => validAuth,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = { services: { logger } };
    const result = await loader(ctx);
    expect(result.auth.default).toBeDefined();
    expect(result.auth.default.name).toBe('default');
  });

  test('loads valid auth module (factory export)', async () => {
    const logger = mockLogger();
    const factory = (context) => {
      return { name: 'factory', roles: {}, guards: {}, options: { context } };
    };
    // Pass extra properties at the root, logger in services
    const ctx = { services: { logger }, foo: 42, bar: 'baz' };
    const loader = createAuthLoader({
      // Call the factory with the test context
      importAndApplyAll: async () => factory(ctx),
      findFiles: async () => ['fake.js'],
      logger
    });
    const result = await loader(ctx);
    expect(result.auth.factory).toBeDefined();
    expect(result.auth.factory.options.context.foo).toBe(42);
    expect(result.auth.factory.options.context.bar).toBe('baz');
  });

  test('returns empty registry for invalid auth module (missing name)', async () => {
    const logger = mockLogger();
    const invalidAuth = { roles: {}, guards: {}, options: {} };
    const loader = createAuthLoader({
      importAndApplyAll: async () => invalidAuth,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = { services: { logger } };
    const result = await loader(ctx);
    expect(result.auth).toEqual({});
  });

  test('handles array of auth modules', async () => {
    const logger = mockLogger();
    const authModules = [
      { name: 'a', roles: {}, guards: {}, options: {} },
      { name: 'b', roles: {}, guards: {}, options: {} }
    ];
    const loader = createAuthLoader({
      importAndApplyAll: async () => authModules,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = { services: { logger } };
    const result = await loader(ctx);
    expect(result.auth.a).toBeDefined();
    expect(result.auth.b).toBeDefined();
  });

  test('returns empty registry for completely invalid modules', async () => {
    const logger = mockLogger();
    // All are invalid: null, undefined, {}, { name: 1 }
    const authModules = [null, undefined, {}, { name: 1 }];
    const loader = createAuthLoader({
      importAndApplyAll: async () => authModules,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = { services: { logger } };
    const result = await loader(ctx);
    expect(result.auth).toEqual({});
  });
}); 