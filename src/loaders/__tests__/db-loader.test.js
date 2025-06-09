import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createDbLoader } from '../db-loader.js';

const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger } };

// Happy path: valid db object
const validDb = {
  name: 'mongo',
  connection: { readyState: 1 },
  stop: jest.fn(),
  options: { inMemory: true }
};

// Factory function export (async)
const validDbFactory = jest.fn(async () => ({
  name: 'redis',
  connection: { status: 'connected' },
  options: { cluster: false }
}));

// Array of dbs
const dbArray = [
  { name: 'dbA', connection: { a: 1 } },
  { name: 'dbB', connection: { b: 2 } }
];

// Duplicate name
const duplicateDbA = { name: 'dupe', connection: { a: 1 } };
const duplicateDbB = { name: 'dupe', connection: { b: 2 } };

// Invalid: missing name
const invalidDb = { connection: { bad: true } };
// Invalid: missing connection
const invalidDb2 = { name: 'noConn' };

describe('createDbLoader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads and registers a valid db object', async () => {
    const files = ['mongo.db.js'];
    const modules = { 'mongo.db.js': { default: validDb } };
    const loader = createDbLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, dbs: {} });
    expect(result.dbs.mongo).toBeDefined();
    expect(result.dbs.mongo.connection).toBe(validDb.connection);
    expect(result.dbs.mongo.options).toEqual({ inMemory: true });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers a db from an async factory function', async () => {
    const files = ['redis.db.js'];
    const modules = { 'redis.db.js': { default: validDbFactory } };
    const loader = createDbLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, dbs: {} });
    expect(result.dbs.redis).toBeDefined();
    expect(result.dbs.redis.connection).toBeDefined();
    expect(result.dbs.redis.options).toEqual({ cluster: false });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers an array of dbs', async () => {
    const files = ['array.db.js'];
    const modules = { 'array.db.js': { default: dbArray } };
    const loader = createDbLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, dbs: {} });
    expect(result.dbs.dbA).toBeDefined();
    expect(result.dbs.dbB).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate db names (edge case)', async () => {
    const files = ['dupeA.db.js', 'dupeB.db.js'];
    const modules = {
      'dupeA.db.js': { default: duplicateDbA },
      'dupeB.db.js': { default: duplicateDbB }
    };
    const loader = createDbLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, dbs: {} });
    expect(result.dbs.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid db objects and does not register them (failure)', async () => {
    const files = ['bad.db.js', 'bad2.db.js'];
    const modules = {
      'bad.db.js': { default: invalidDb },
      'bad2.db.js': { default: invalidDb2 }
    };
    const loader = createDbLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, dbs: {} });
    expect(result.dbs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 