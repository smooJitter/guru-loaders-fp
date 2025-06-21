import { createActionLoader } from '../index.js';

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

describe('action-loader', () => {
  test('loads valid actions (array export)', async () => {
    const logger = mockLogger();
    const validActions = [
      { namespace: 'user', name: 'create', method: () => 'created' },
      { namespace: 'user', name: 'delete', method: () => 'deleted' },
      { namespace: 'admin', name: 'ban', method: () => 'banned' }
    ];
    const loader = createActionLoader({
      importAndApplyAll: async () => validActions,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.actions).toBeDefined();
    expect(result.actions.user.create()).toBe('created');
    expect(result.actions.user.delete()).toBe('deleted');
    expect(result.actions.admin.ban()).toBe('banned');
    expect(logger.calls.error.length).toBe(0);
  });

  test('loads valid action (single object export)', async () => {
    const logger = mockLogger();
    const validAction = { namespace: 'user', name: 'update', method: () => 'updated' };
    const loader = createActionLoader({
      importAndApplyAll: async () => validAction,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.actions.user.update()).toBe('updated');
    expect(logger.calls.error.length).toBe(0);
  });

  test('logs error for invalid action (missing fields)', async () => {
    const logger = mockLogger();
    const invalidAction = { namespace: 'user', name: 123, method: 'notAFunction' };
    const loader = createActionLoader({
      importAndApplyAll: async () => invalidAction,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.actions).toEqual({});
    expect(logger.calls.error.length).toBeGreaterThan(0);
    expect(logger.calls.error[0][0]).toMatch(/invalid 'name'/);
  });

  test('handles array with some invalid actions', async () => {
    const logger = mockLogger();
    const actions = [
      { namespace: 'user', name: 'good', method: () => 'ok' },
      { namespace: 42, name: 'bad', method: null }
    ];
    const loader = createActionLoader({
      importAndApplyAll: async () => actions,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.actions.user.good()).toBe('ok');
    expect(result.actions[42]).toBeUndefined();
    expect(logger.calls.error.length).toBeGreaterThan(0);
  });

  test('returns empty registry for completely invalid actions', async () => {
    const logger = mockLogger();
    const actions = [null, undefined, {}, { name: 1 }];
    const loader = createActionLoader({
      importAndApplyAll: async () => actions,
      findFiles: async () => ['fake.js'],
      logger
    });
    const ctx = mockContext({ services: { logger } });
    const result = await loader(ctx);
    expect(result.actions).toEqual({});
    expect(logger.calls.error.length).toBeGreaterThan(0);
  });
}); 