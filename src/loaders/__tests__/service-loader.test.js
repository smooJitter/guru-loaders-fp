import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { serviceLoader } from '../service-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  services: {},
  config: { foo: 'bar' },
  logger: mockLogger
});

// Happy path: valid service factory
const validServiceFactory = jest.fn(() => ({
  name: 'spotifyService',
  service: { play: jest.fn(), pause: jest.fn() }
}));

// Edge: duplicate name factories
const duplicateServiceFactoryA = jest.fn(() => ({ name: 'dupeService', service: { foo: 1 } }));
const duplicateServiceFactoryB = jest.fn(() => ({ name: 'dupeService', service: { bar: 2 } }));

// Failure: invalid service (missing name)
const invalidServiceFactory = jest.fn(() => ({ service: { foo: 'bar' } }));

// Failure: invalid service (missing service)
const missingServiceFactory = jest.fn(() => ({ name: 'noService' }));

describe('serviceLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid service object from a factory (happy path)', async () => {
    const files = ['spotify.service.js'];
    const modules = { 'spotify.service.js': { default: validServiceFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await serviceLoader(ctx);
    expect(result.services.spotifyService).toMatchObject({
      play: expect.any(Function),
      pause: expect.any(Function)
    });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate service names (edge case)', async () => {
    const files = ['dupeA.service.js', 'dupeB.service.js'];
    const modules = {
      'dupeA.service.js': { default: duplicateServiceFactoryA },
      'dupeB.service.js': { default: duplicateServiceFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await serviceLoader(ctx);
    expect(result.services.dupeService).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith('[service-loader]', 'Duplicate service names found:', ['dupeService']);
  });

  it('skips invalid service objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.service.js'];
    const modules = { 'bad.service.js': { default: invalidServiceFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await serviceLoader(ctx);
    expect(result.services).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid service objects (missing service) and does not register them (failure)', async () => {
    const files = ['noService.service.js'];
    const modules = { 'noService.service.js': { default: missingServiceFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await serviceLoader(ctx);
    expect(result.services).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.service.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await serviceLoader(ctx);
    expect(result.services).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await serviceLoader(ctx);
    expect(result.services).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('injects context/services/config into service factory', async () => {
    const injectedFactory = jest.fn((ctx) => ({
      name: 'contextService',
      service: { configValue: ctx.config.foo }
    }));
    const files = ['context.service.js'];
    const modules = { 'context.service.js': { default: injectedFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file].default(ctx),
      findFiles: () => files
    };
    const result = await serviceLoader(ctx);
    expect(result.services.contextService.configValue).toBe('bar');
  });
}); 