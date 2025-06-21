import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { envLoader } from '../env-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  services: { logger: mockLogger },
  config: { foo: 'bar' },
  envs: {},
  logger: mockLogger
});

// Happy path: valid env factory
const validEnvFactory = jest.fn(() => ({
  name: 'user',
  NODE_ENV: 'development',
  API_URL: 'http://localhost:3000',
  FEATURE_FLAG: false
}));

// Edge: duplicate name factories
const duplicateEnvFactoryA = jest.fn(() => ({ name: 'dupe', NODE_ENV: 'dev' }));
const duplicateEnvFactoryB = jest.fn(() => ({ name: 'dupe', NODE_ENV: 'prod' }));

// Failure: invalid env (missing name)
const invalidEnvFactory = jest.fn(() => ({ NODE_ENV: 'dev' }));

// Failure: not an object
const invalidExport = 42;

describe('envLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid env object from a factory (happy path)', async () => {
    const files = ['user.environment.js'];
    const modules = { 'user.environment.js': { default: validEnvFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    ctx.logger = mockLogger;
    ctx.services.logger = mockLogger;
    ctx.options.logger = mockLogger;
    const result = await envLoader(ctx);
    expect(result.envs).toBeDefined();
    expect(result.envs.user).toMatchObject({
      name: 'user',
      NODE_ENV: 'development',
      API_URL: 'http://localhost:3000',
      FEATURE_FLAG: false
    });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate env names (edge case)', async () => {
    const files = ['dupeA.environment.js', 'dupeB.environment.js'];
    const modules = {
      'dupeA.environment.js': { default: duplicateEnvFactoryA },
      'dupeB.environment.js': { default: duplicateEnvFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    ctx.logger = mockLogger;
    ctx.services.logger = mockLogger;
    ctx.options.logger = mockLogger;
    const result = await envLoader(ctx);
    expect(result.envs.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid env objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.environment.js'];
    const modules = { 'bad.environment.js': { default: invalidEnvFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    ctx.logger = mockLogger;
    ctx.services.logger = mockLogger;
    ctx.options.logger = mockLogger;
    const result = await envLoader(ctx);
    expect(result.envs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips non-object modules and logs error (failure)', async () => {
    const files = ['fail.environment.js'];
    const modules = { 'fail.environment.js': { default: invalidExport } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    ctx.logger = mockLogger;
    ctx.services.logger = mockLogger;
    ctx.options.logger = mockLogger;
    const result = await envLoader(ctx);
    expect(result.envs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    ctx.logger = mockLogger;
    ctx.services.logger = mockLogger;
    ctx.options.logger = mockLogger;
    const result = await envLoader(ctx);
    expect(result.envs).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.environment.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    ctx.logger = mockLogger;
    ctx.services.logger = mockLogger;
    ctx.options.logger = mockLogger;
    const result = await envLoader(ctx);
    expect(result.envs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('logs to console.info if no logger is present', async () => {
    const ctx = { envs: {} }; // no services.logger
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    await envLoader(ctx);
    expect(consoleSpy).toHaveBeenCalledWith('[env-loader] Final envs registry:', {});
    consoleSpy.mockRestore();
  });
}); 