import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createPubsubLoader } from '../pubsub-loader.js';

const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger } };

// Happy path: valid pubsub object with direct pubsub instance
const validPubsub = {
  name: 'notifications',
  pubsub: { publish: jest.fn(), subscribe: jest.fn() },
  topics: { NOTIFY: 'notify' },
  handlers: { NOTIFY: jest.fn() }
};

// Factory function export
const validPubsubFactory = jest.fn(() => ({
  name: 'factoryEvents',
  topics: { FACTORY: 'factory' },
  handlers: { FACTORY: jest.fn() }
}));

// Array of pubsubs
const pubsubArray = [
  { name: 'arrayA', topics: { A: 'a' }, handlers: { A: jest.fn() } },
  { name: 'arrayB', topics: { B: 'b' }, handlers: { B: jest.fn() } }
];

// Duplicate name
const duplicatePubsubA = { name: 'dupe', topics: {}, handlers: {} };
const duplicatePubsubB = { name: 'dupe', topics: {}, handlers: {} };

// Invalid: missing name
const invalidPubsub = { topics: {}, handlers: {} };

describe('createPubsubLoader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads and registers a valid pubsub object with direct pubsub instance', async () => {
    const files = ['notifications.pubsub.js'];
    const modules = { 'notifications.pubsub.js': { default: validPubsub } };
    const loader = createPubsubLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, pubsubs: {} });
    expect(result.pubsubs.notifications).toBeDefined();
    expect(result.pubsubs.notifications.pubsub).toBe(validPubsub.pubsub);
    expect(result.pubsubs.notifications.topics.NOTIFY).toBe('notify');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers a pubsub from a factory function', async () => {
    const files = ['factory.pubsub.js'];
    const modules = { 'factory.pubsub.js': { default: validPubsubFactory } };
    const loader = createPubsubLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, pubsubs: {} });
    expect(result.pubsubs.factoryEvents).toBeDefined();
    expect(result.pubsubs.factoryEvents.topics.FACTORY).toBe('factory');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers an array of pubsubs', async () => {
    const files = ['array.pubsub.js'];
    const modules = { 'array.pubsub.js': { default: pubsubArray } };
    const loader = createPubsubLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, pubsubs: {} });
    expect(result.pubsubs.arrayA).toBeDefined();
    expect(result.pubsubs.arrayB).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate pubsub names (edge case)', async () => {
    const files = ['dupeA.pubsub.js', 'dupeB.pubsub.js'];
    const modules = {
      'dupeA.pubsub.js': { default: duplicatePubsubA },
      'dupeB.pubsub.js': { default: duplicatePubsubB }
    };
    const loader = createPubsubLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, pubsubs: {} });
    expect(result.pubsubs.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid pubsub objects and does not register them (failure)', async () => {
    const files = ['bad.pubsub.js'];
    const modules = { 'bad.pubsub.js': { default: invalidPubsub } };
    const loader = createPubsubLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, pubsubs: {} });
    expect(result.pubsubs).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 