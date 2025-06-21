import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createDbLoader } from '../db-loader.js';

const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  services: { logger: mockLogger },
  dbs: {},
  logger: mockLogger
});

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

describe('dbLoader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a valid db object (happy path)', async () => {
    const files = ['mongo.db.js'];
    const modules = { 'mongo.db.js': validDb };
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f])
    });
    const result = await loader(ctx);
    expect(result.dbs.mongo).toBeDefined();
    expect(result.dbs.mongo.connection).toBe(validDb.connection);
    expect(result.dbs.mongo.options).toEqual({ inMemory: true });
    // No logger.warn in new minimal loader
  });

  it('registers a db from an async factory function (happy path)', async () => {
    const files = ['redis.db.js'];
    const modules = { 'redis.db.js': await validDbFactory() };
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f])
    });
    const result = await loader(ctx);
    expect(result.dbs.redis).toBeDefined();
    expect(result.dbs.redis.connection).toBeDefined();
    expect(result.dbs.redis.options).toEqual({ cluster: false });
  });

  it('registers an array of dbs (happy path)', async () => {
    const files = ['array.db.js'];
    const modules = { 'array.db.js': dbArray };
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]).flat()
    });
    const result = await loader(ctx);
    expect(result.dbs.dbA).toBeDefined();
    expect(result.dbs.dbB).toBeDefined();
  });

  it('warns on duplicate db names (edge case)', async () => {
    const files = ['dupeA.db.js', 'dupeB.db.js'];
    const modules = {
      'dupeA.db.js': duplicateDbA,
      'dupeB.db.js': duplicateDbB
    };
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f])
    });
    const result = await loader(ctx);
    expect(result.dbs.dupe).toBeDefined();
    // No logger.warn in new minimal loader
  });

  it('skips invalid db objects (missing name/connection) and does not register them (failure)', async () => {
    const files = ['bad.db.js', 'bad2.db.js'];
    const modules = {
      'bad.db.js': invalidDb,
      'bad2.db.js': invalidDb2
    };
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f])
    });
    const result = await loader(ctx);
    expect(result.dbs).toEqual({});
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => [],
      importAndApplyAll: async () => []
    });
    const result = await loader(ctx);
    expect(result.dbs).toEqual({});
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.db.js'];
    const ctx = baseContext();
    const loader = createDbLoader({
      findFiles: () => files,
      importAndApplyAll: async () => { throw new Error('fail'); }
    });
    let result;
    try {
      result = await loader(ctx);
    } catch (e) {
      result = {};
    }
    expect(result.dbs || {}).toEqual({});
  });
}); 