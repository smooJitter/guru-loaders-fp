import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sdlLoader } from '../sdl-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  sdls: {},
  services: { logger: mockLogger },
  config: {},
  logger: mockLogger
});

// Happy path: valid sdl factory
const validSdlFactory = jest.fn((ctx) => ({
  name: 'User',
  sdl: 'type User { id: ID! name: String! }'
}));

// Edge: duplicate name factories
const duplicateSdlFactoryA = jest.fn((ctx) => ({ name: 'dupe', sdl: 'type A { a: Int }' }));
const duplicateSdlFactoryB = jest.fn((ctx) => ({ name: 'dupe', sdl: 'type B { b: Int }' }));

// Failure: invalid sdl (missing name)
const invalidSdlFactory = jest.fn((ctx) => ({ sdl: 'type X { x: Int }' }));
// Failure: invalid sdl (not a string)
const invalidTypeSdlFactory = jest.fn((ctx) => ({ name: 'bad', sdl: 42 }));

describe('sdlLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid sdl object from a factory (happy path)', async () => {
    const files = ['User.sdl.js'];
    const modules = { 'User.sdl.js': { default: validSdlFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await sdlLoader(ctx);
    expect(result.sdls.User).toBeDefined();
    expect(result.sdls.User.sdl).toBe('type User { id: ID! name: String! }');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate sdl names (edge case)', async () => {
    const files = ['dupeA.sdl.js', 'dupeB.sdl.js'];
    const modules = {
      'dupeA.sdl.js': { default: duplicateSdlFactoryA },
      'dupeB.sdl.js': { default: duplicateSdlFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await sdlLoader(ctx);
    expect(result.sdls.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith('[sdl-loader] Duplicate SDL name: dupe');
  });

  it('skips invalid sdl objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.sdl.js'];
    const modules = { 'bad.sdl.js': { default: invalidSdlFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await sdlLoader(ctx);
    expect(result.sdls).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith('[sdl-loader] Dropped invalid SDL object during transform (missing name).', expect.any(Object));
  });

  it('skips invalid sdl objects (not a string) and does not register them (failure)', async () => {
    const files = ['badtype.sdl.js'];
    const modules = { 'badtype.sdl.js': { default: invalidTypeSdlFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file) => modules[file],
      findFiles: () => files
    };
    const result = await sdlLoader(ctx);
    expect(result.sdls).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith('[sdl-loader] SDL object has invalid schema (not a string).', expect.any(Object));
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await sdlLoader(ctx);
    expect(result.sdls).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.sdl.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await sdlLoader(ctx);
    expect(result.sdls).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 