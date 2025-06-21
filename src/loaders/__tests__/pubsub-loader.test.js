import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createPubsubLoader } from '../pubsub-loader.js';
import * as R from 'ramda';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  pubsubs: {},
  services: { logger: mockLogger },
  config: {},
  logger: mockLogger
});

// Factories and modules for various test cases
const validPubsubFactory = jest.fn(() => ({
  name: 'userEvents',
  topics: { USER_CREATED: 'user.created' },
  handlers: { USER_CREATED: jest.fn() }
}));
const validPubsubObject = {
  name: 'postEvents',
  topics: { POST_PUBLISHED: 'post.published' },
  handlers: { POST_PUBLISHED: jest.fn() }
};
const validPubsubArray = [
  { name: 'commentEvents', topics: {}, handlers: {} },
  { name: 'likeEvents', topics: {}, handlers: {} }
];
const duplicatePubsubA = { name: 'dupe', topics: {}, handlers: {} };
const duplicatePubsubB = { name: 'dupe', topics: {}, handlers: {} };
const invalidPubsubNoName = { topics: {}, handlers: {} };
const invalidPubsubNotObject = 42;

// --- Test Suite ---
describe('pubsubLoader (core-loader-new, superb quality)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeLoader({ files, modules }) {
    return createPubsubLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) =>
        R.flatten(_files.map(f => modules[f])),
    });
  }

  it('registers a valid pubsub object from a factory (happy path)', async () => {
    const files = ['user.pubsub.js'];
    const modules = { 'user.pubsub.js': validPubsubFactory() };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs.userEvents).toBeDefined();
    expect(result.pubsubs.userEvents.topics.USER_CREATED).toBe('user.created');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('registers a valid pubsub plain object (happy path)', async () => {
    const files = ['post.pubsub.js'];
    const modules = { 'post.pubsub.js': validPubsubObject };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs.postEvents).toBeDefined();
    expect(result.pubsubs.postEvents.topics.POST_PUBLISHED).toBe('post.published');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('registers multiple pubsubs from an array (happy path)', async () => {
    const files = ['multi.pubsub.js'];
    const modules = { 'multi.pubsub.js': validPubsubArray };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs.commentEvents).toBeDefined();
    expect(result.pubsubs.likeEvents).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate pubsub names (last wins)', async () => {
    const files = ['dupeA.pubsub.js', 'dupeB.pubsub.js'];
    const modules = {
      'dupeA.pubsub.js': duplicatePubsubA,
      'dupeB.pubsub.js': duplicatePubsubB
    };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate pubsub name: dupe'));
    expect(result.pubsubs.dupe).toEqual(duplicatePubsubB);
  });

  it('skips invalid pubsub objects (missing name)', async () => {
    const files = ['bad.pubsub.js'];
    const modules = { 'bad.pubsub.js': invalidPubsubNoName };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('skips non-object module', async () => {
    const files = ['num.pubsub.js'];
    const modules = { 'num.pubsub.js': invalidPubsubNotObject };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicate'));
  });

  it('skips array with invalid pubsubs', async () => {
    const files = ['arr.pubsub.js'];
    const modules = { 'arr.pubsub.js': [invalidPubsubNoName, validPubsubObject] };
    const ctx = baseContext();
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.pubsubs.postEvents).toBeDefined();
    expect(Object.keys(result.pubsubs)).toHaveLength(1);
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const loader = makeLoader({ files: [], modules: {} });
    const result = await loader(ctx);
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('propagates context and services through loader', async () => {
    const files = ['user.pubsub.js'];
    const modules = { 'user.pubsub.js': validPubsubFactory() };
    const ctx = baseContext();
    ctx.services.extra = { foo: 42 };
    const loader = makeLoader({ files, modules });
    const result = await loader(ctx);
    expect(result.services.extra).toBeDefined();
    expect(result.services.extra.foo).toBe(42);
  });
}); 