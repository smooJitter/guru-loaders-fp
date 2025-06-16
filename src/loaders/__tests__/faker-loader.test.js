import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createFakerLoader } from '../faker-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  fakers: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid faker factory
const validFakerFactory = jest.fn(() => ({ name: 'userFaker', faker: jest.fn() }));

// Edge: duplicate name factories
const duplicateFakerFactoryA = jest.fn(() => ({ name: 'dupe', faker: jest.fn() }));
const duplicateFakerFactoryB = jest.fn(() => ({ name: 'dupe', faker: jest.fn() }));

// Failure: invalid faker (missing name)
const invalidFakerFactory = jest.fn(() => ({ faker: jest.fn() }));

// Failure: invalid faker (not a function)
const invalidTypeFakerFactory = jest.fn(() => ({ name: 'bad', faker: 42 }));

describe('fakerLoader', () => {
  let fakerLoader;
  beforeEach(() => {
    jest.clearAllMocks();
    fakerLoader = createFakerLoader({
      patterns: ['*.faker.js'],
      findFiles: () => [],
      importModule: async () => ({})
    });
  });

  it('registers a valid faker object from a factory (happy path)', async () => {
    const files = ['userFaker.faker.js'];
    const modules = { 'userFaker.faker.js': { default: validFakerFactory } };
    fakerLoader = createFakerLoader({
      patterns: ['*.faker.js'],
      findFiles: () => files,
      importModule: async (file, ctx) => modules[file]
    });
    const ctx = baseContext();
    const result = await fakerLoader(ctx);
    expect(result.fakers.userFaker).toBeDefined();
    expect(typeof result.fakers.userFaker.faker).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate faker names (edge case)', async () => {
    const files = ['dupeA.faker.js', 'dupeB.faker.js'];
    const modules = {
      'dupeA.faker.js': { default: duplicateFakerFactoryA },
      'dupeB.faker.js': { default: duplicateFakerFactoryB }
    };
    fakerLoader = createFakerLoader({
      patterns: ['*.faker.js'],
      findFiles: () => files,
      importModule: async (file, ctx) => modules[file]
    });
    const ctx = baseContext();
    const result = await fakerLoader(ctx);
    expect(result.fakers.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid faker objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.faker.js'];
    const modules = { 'bad.faker.js': { default: invalidFakerFactory } };
    fakerLoader = createFakerLoader({
      patterns: ['*.faker.js'],
      findFiles: () => files,
      importModule: async (file, ctx) => modules[file]
    });
    const ctx = baseContext();
    const result = await fakerLoader(ctx);
    expect(result.fakers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid faker objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.faker.js'];
    const modules = { 'badtype.faker.js': { default: invalidTypeFakerFactory } };
    fakerLoader = createFakerLoader({
      patterns: ['*.faker.js'],
      findFiles: () => files,
      importModule: async (file, ctx) => modules[file]
    });
    const ctx = baseContext();
    const result = await fakerLoader(ctx);
    expect(result.fakers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const result = await fakerLoader(ctx);
    expect(result.fakers).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.faker.js'];
    fakerLoader = createFakerLoader({
      patterns: ['*.faker.js'],
      findFiles: () => files,
      importModule: async () => { throw new Error('fail'); }
    });
    const ctx = baseContext();
    const result = await fakerLoader(ctx);
    expect(result.fakers).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 