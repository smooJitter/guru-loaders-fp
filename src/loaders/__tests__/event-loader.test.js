import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { eventLoader } from '../event-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  events: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid event factory
const validEventFactory = jest.fn(() => ({
  name: 'userCreated',
  event: jest.fn()
}));

// Edge: duplicate name factories
const duplicateEventFactoryA = jest.fn(() => ({ name: 'dupe', event: jest.fn() }));
const duplicateEventFactoryB = jest.fn(() => ({ name: 'dupe', event: jest.fn() }));

// Failure: invalid event (missing name)
const invalidEventFactory = jest.fn(() => ({ event: jest.fn() }));
// Failure: invalid event (not a function)
const invalidTypeEventFactory = jest.fn(() => ({ name: 'bad', event: 42 }));

describe('eventLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a valid event object from a factory (happy path)', async () => {
    const files = ['userCreated.event.js'];
    const modules = { 'userCreated.event.js': { default: validEventFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await eventLoader(ctx);
    expect(result.events.userCreated).toBeDefined();
    expect(typeof result.events.userCreated.event).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate event names (edge case)', async () => {
    const files = ['dupeA.event.js', 'dupeB.event.js'];
    const modules = {
      'dupeA.event.js': { default: duplicateEventFactoryA },
      'dupeB.event.js': { default: duplicateEventFactoryB }
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await eventLoader(ctx);
    expect(result.events.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid event objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.event.js'];
    const modules = { 'bad.event.js': { default: invalidEventFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await eventLoader(ctx);
    expect(result.events).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid event objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.event.js'];
    const modules = { 'badtype.event.js': { default: invalidTypeEventFactory } };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await eventLoader(ctx);
    expect(result.events).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await eventLoader(ctx);
    expect(result.events).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.event.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await eventLoader(ctx);
    expect(result.events).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 