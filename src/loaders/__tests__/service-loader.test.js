import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createServiceLoader } from '../service-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger }, config: { foo: 'bar' } };

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

describe('createServiceLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and registers a valid service object from a factory (happy path)', async () => {
    const files = ['spotify.service.js'];
    const modules = { 'spotify.service.js': { default: validServiceFactory } };
    const loader = createServiceLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, services: {}, logger: mockLogger });
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
    const loader = createServiceLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, services: {}, logger: mockLogger });
    expect(result.services.dupeService).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith('[service-loader] Duplicate service names found:', ['dupeService']);
  });

  it('skips invalid service objects and does not register them (failure)', async () => {
    const files = ['bad.service.js'];
    const modules = { 'bad.service.js': { default: invalidServiceFactory } };
    const loader = createServiceLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, services: {}, logger: mockLogger });
    expect(result.services).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 