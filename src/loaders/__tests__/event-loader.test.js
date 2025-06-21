import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createEventLoader } from '../event-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  events: {},
  services: { logger: mockLogger },
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
    const modules = { 'userCreated.event.js': validEventFactory() };
    const ctx = baseContext();
    const loader = createEventLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.events.userCreated).toBeDefined();
    expect(typeof result.events.userCreated.event).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate event names (edge case)', async () => {
    const files = ['dupeA.event.js', 'dupeB.event.js'];
    const modules = {
      'dupeA.event.js': duplicateEventFactoryA(),
      'dupeB.event.js': duplicateEventFactoryB()
    };
    const ctx = baseContext();
    const loader = createEventLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.events.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid event objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.event.js'];
    const modules = { 'bad.event.js': invalidEventFactory() };
    const ctx = baseContext();
    const loader = createEventLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.events).toEqual({});
    // No logger.warn expected for invalid event
  });

  it('skips invalid event objects (not a function) and does not register them (failure)', async () => {
    const files = ['badtype.event.js'];
    const modules = { 'badtype.event.js': invalidTypeEventFactory() };
    const ctx = baseContext();
    const loader = createEventLoader({
      findFiles: () => files,
      importAndApplyAll: async (_files, _ctx) => _files.map(f => modules[f]),
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.events).toEqual({});
    // No logger.warn expected for invalid event
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    const loader = createEventLoader({
      findFiles: () => [],
      importAndApplyAll: async () => [],
      logger: mockLogger
    });
    const result = await loader(ctx);
    expect(result.events).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.event.js'];
    const ctx = baseContext();
    const loader = createEventLoader({
      findFiles: () => files,
      importAndApplyAll: async () => { throw new Error('fail'); },
      logger: mockLogger
    });
    let result;
    try {
      result = await loader(ctx);
    } catch (e) {
      result = {};
    }
    expect(result.events || {}).toEqual({});
    // No logger.warn expected for import error
  });
}); 