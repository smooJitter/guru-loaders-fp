import { createHandlerLoader } from '../index.js';

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
  return { services: {}, ...overrides };
}

describe('handler-loader', () => {
  test('loads valid handlers (array export)', async () => {
    const logger = mockLogger();
    const validHandlers = [
      { namespace: 'user', name: 'onCreate', method: () => 'created' },
      { namespace: 'user', name: 'onDelete', method: () => 'deleted' },
      { namespace: 'admin', name: 'onBan', method: () => 'banned' }
    ];
    const loader = createHandlerLoader({
      importAndApplyAll: async () => validHandlers,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.handlers).toBeDefined();
    expect(result.handlers.user.onCreate()).toBe('created');
    expect(result.handlers.user.onDelete()).toBe('deleted');
    expect(result.handlers.admin.onBan()).toBe('banned');
    expect(logger.calls.error.length).toBe(0);
  });

  test('loads valid handler (single object export)', async () => {
    const logger = mockLogger();
    const validHandler = { namespace: 'user', name: 'onUpdate', method: () => 'updated' };
    const loader = createHandlerLoader({
      importAndApplyAll: async () => validHandler,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.handlers.user.onUpdate()).toBe('updated');
    expect(logger.calls.error.length).toBe(0);
  });

  test('logs error for invalid handler (missing fields)', async () => {
    const logger = mockLogger();
    const invalidHandler = { namespace: 'user', name: 123, method: 'notAFunction' };
    const loader = createHandlerLoader({
      importAndApplyAll: async () => invalidHandler,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.handlers).toEqual({});
    expect(logger.calls.error.length).toBeGreaterThan(0);
    expect(logger.calls.error[0][0]).toMatch(/invalid 'name'/);
    // No need to check for 'method' error if 'name' is already invalid
  });

  test('handles array with some invalid handlers', async () => {
    const logger = mockLogger();
    const handlers = [
      { namespace: 'user', name: 'good', method: () => 'ok' },
      { namespace: 42, name: 'bad', method: null }
    ];
    const loader = createHandlerLoader({
      importAndApplyAll: async () => handlers,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.handlers.user.good()).toBe('ok');
    expect(result.handlers[42]).toBeUndefined();
    expect(logger.calls.error.length).toBeGreaterThan(0);
  });

  test('returns empty registry for completely invalid handlers', async () => {
    const logger = mockLogger();
    const handlers = [null, undefined, {}, { name: 1 }];
    const loader = createHandlerLoader({
      importAndApplyAll: async () => handlers,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.handlers).toEqual({});
    expect(logger.calls.error.length).toBeGreaterThan(0);
  });
}); 