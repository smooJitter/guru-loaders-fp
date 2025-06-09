import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createSdlLoader } from '../sdl-loader.js';

const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger } };

// Happy path: valid sdl object
const validSdl = {
  name: 'userSchema',
  schema: 'type User { id: ID! name: String! }',
  options: { version: 1 }
};

// Factory function export
const validSdlFactory = jest.fn(() => ({
  name: 'postSchema',
  schema: 'type Post { id: ID! title: String! }',
  options: { version: 2 }
}));

// Array of sdls
const sdlArray = [
  { name: 'sdlA', schema: 'type A { a: Int }' },
  { name: 'sdlB', schema: 'type B { b: Int }' }
];

// Duplicate name
const duplicateSdlA = { name: 'dupe', schema: 'type X { x: Int }' };
const duplicateSdlB = { name: 'dupe', schema: 'type Y { y: Int }' };

// Invalid: missing name
const invalidSdl = { schema: 'type Bad { bad: Int }' };
// Invalid: missing schema
const invalidSdl2 = { name: 'noSchema' };

describe('createSdlLoader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads and registers a valid sdl object', async () => {
    const files = ['userSchema.sdl.js'];
    const modules = { 'userSchema.sdl.js': { default: validSdl } };
    const loader = createSdlLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, sdls: {} });
    expect(result.sdls.userSchema).toBeDefined();
    expect(result.sdls.userSchema.schema).toBe(validSdl.schema);
    expect(result.sdls.userSchema.options).toEqual({ version: 1 });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers an sdl from a factory function', async () => {
    const files = ['postSchema.sdl.js'];
    const modules = { 'postSchema.sdl.js': { default: validSdlFactory } };
    const loader = createSdlLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, sdls: {} });
    expect(result.sdls.postSchema).toBeDefined();
    expect(result.sdls.postSchema.schema).toBe('type Post { id: ID! title: String! }');
    expect(result.sdls.postSchema.options).toEqual({ version: 2 });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers an array of sdls', async () => {
    const files = ['array.sdl.js'];
    const modules = { 'array.sdl.js': { default: sdlArray } };
    const loader = createSdlLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, sdls: {} });
    expect(result.sdls.sdlA).toBeDefined();
    expect(result.sdls.sdlB).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate sdl names (edge case)', async () => {
    const files = ['dupeA.sdl.js', 'dupeB.sdl.js'];
    const modules = {
      'dupeA.sdl.js': { default: duplicateSdlA },
      'dupeB.sdl.js': { default: duplicateSdlB }
    };
    const loader = createSdlLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, sdls: {} });
    expect(result.sdls.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid sdl objects and does not register them (failure)', async () => {
    const files = ['bad.sdl.js', 'bad2.sdl.js'];
    const modules = {
      'bad.sdl.js': { default: invalidSdl },
      'bad2.sdl.js': { default: invalidSdl2 }
    };
    const loader = createSdlLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, sdls: {} });
    expect(result.sdls).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 