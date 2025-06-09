import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createEnvLoader } from '../env-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger }, config: { foo: 'bar' } };

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

describe('createEnvLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers a valid env object from a factory (happy path)', async () => {
    const files = ['user.environment.js'];
    const modules = { 'user.environment.js': { default: validEnvFactory } };
    const loader = createEnvLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        return modules[file];
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, envs: {} });
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
    const loader = createEnvLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        return modules[file];
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, envs: {} });
    expect(result.envs.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid env objects and does not register them (failure)', async () => {
    const files = ['bad.environment.js'];
    const modules = { 'bad.environment.js': { default: invalidEnvFactory } };
    const loader = createEnvLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        return modules[file];
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, envs: {} });
    expect(result.envs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips non-object modules and logs error (failure)', async () => {
    const files = ['fail.environment.js'];
    const modules = { 'fail.environment.js': { default: invalidExport } };
    const loader = createEnvLoader({
      importModule: async (file, ctx) => {
        if (!(file in modules)) throw new Error(`No module mock for file: ${file}`);
        return modules[file];
      },
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, envs: {} });
    expect(result.envs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 