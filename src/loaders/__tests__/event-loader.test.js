import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createEventLoader } from '../event-loader.js';

const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
const mockContext = { services: { logger: mockLogger } };

// Happy path: valid event object
const validEvent = {
  name: 'userCreated',
  handler: jest.fn(),
  options: { once: true }
};

// Factory function export
const validEventFactory = jest.fn(() => ({
  name: 'userUpdated',
  handler: jest.fn(),
  options: { once: false }
}));

// Array of events
const eventArray = [
  { name: 'eventA', handler: jest.fn() },
  { name: 'eventB', handler: jest.fn() }
];

// Duplicate name
const duplicateEventA = { name: 'dupe', handler: jest.fn() };
const duplicateEventB = { name: 'dupe', handler: jest.fn() };

// Invalid: missing name
const invalidEvent = { handler: jest.fn() };

describe('createEventLoader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads and registers a valid event object', async () => {
    const files = ['userCreated.event.js'];
    const modules = { 'userCreated.event.js': { default: validEvent } };
    const loader = createEventLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, events: {} });
    expect(result.events.userCreated).toBeDefined();
    expect(result.events.userCreated.handler).toBe(validEvent.handler);
    expect(result.events.userCreated.options).toEqual({ once: true });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers an event from a factory function', async () => {
    const files = ['userUpdated.event.js'];
    const modules = { 'userUpdated.event.js': { default: validEventFactory } };
    const loader = createEventLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, events: {} });
    expect(result.events.userUpdated).toBeDefined();
    expect(result.events.userUpdated.handler).toBeDefined();
    expect(result.events.userUpdated.options).toEqual({ once: false });
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('loads and registers an array of events', async () => {
    const files = ['array.event.js'];
    const modules = { 'array.event.js': { default: eventArray } };
    const loader = createEventLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, events: {} });
    expect(result.events.eventA).toBeDefined();
    expect(result.events.eventB).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate event names (edge case)', async () => {
    const files = ['dupeA.event.js', 'dupeB.event.js'];
    const modules = {
      'dupeA.event.js': { default: duplicateEventA },
      'dupeB.event.js': { default: duplicateEventB }
    };
    const loader = createEventLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, events: {} });
    expect(result.events.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid event objects and does not register them (failure)', async () => {
    const files = ['bad.event.js'];
    const modules = { 'bad.event.js': { default: invalidEvent } };
    const loader = createEventLoader({
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    });
    const { context: result } = await loader({ ...mockContext, events: {} });
    expect(result.events).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 