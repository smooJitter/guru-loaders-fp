import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { pubsubLoader } from '../pubsub-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  pubsub: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid pubsub factory
const validPubsubFactory = jest.fn(() => ({
  name: 'userTopic',
  topic: 'USER_TOPIC'
}));

// Edge: duplicate name factories
const duplicatePubsubFactoryA = jest.fn(() => ({ name: 'dupe', topic: 'TOPIC_A' }));
const duplicatePubsubFactoryB = jest.fn(() => ({ name: 'dupe', topic: 'TOPIC_B' }));

// Failure: invalid pubsub (missing name)
const invalidPubsubFactory = jest.fn(() => ({ topic: 'NO_NAME' }));
// Failure: invalid pubsub (not a string)
const invalidTypePubsubFactory = jest.fn(() => ({ name: 'bad', topic: 42 }));

describe('pubsubLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid pubsub object from a factory (happy path)', async () => {
    const files = ['userTopic.pubsub.js'];
    const modules = { 'userTopic.pubsub.js': { default: validPubsubFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pubsubLoader(ctx);
    expect(result.pubsubs.userTopic).toBeDefined();
    expect(result.pubsubs.userTopic.topic).toBe('USER_TOPIC');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate pubsub names (edge case)', async () => {
    const files = ['dupeA.pubsub.js', 'dupeB.pubsub.js'];
    const modules = {
      'dupeA.pubsub.js': { default: duplicatePubsubFactoryA },
      'dupeB.pubsub.js': { default: duplicatePubsubFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pubsubLoader(ctx);
    expect(result.pubsubs.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid pubsub objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.pubsub.js'];
    const modules = { 'bad.pubsub.js': { default: invalidPubsubFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pubsubLoader(ctx);
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid pubsub objects (not a string) and does not register them (failure)', async () => {
    const files = ['badtype.pubsub.js'];
    const modules = { 'badtype.pubsub.js': { default: invalidTypePubsubFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pubsubLoader(ctx);
    expect(result.pubsubs.bad).toBeDefined();
    expect(result.pubsubs.bad.topic).toBe(42);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await pubsubLoader(ctx);
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.pubsub.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await pubsubLoader(ctx);
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 