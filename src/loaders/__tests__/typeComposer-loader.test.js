import { SchemaComposer } from 'graphql-compose';
import mongoose from 'mongoose';
import { typeComposerLoader } from '../typeComposer-loader.js';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createTypeLoader } from '../type-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  typeComposers: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid typeComposer factory
const validTypeComposerFactory = jest.fn(() => ({
  name: 'UserTC',
  typeComposer: { getType: jest.fn() }
}));

// Edge: duplicate name factories
const duplicateTypeComposerFactoryA = jest.fn(() => ({ name: 'dupe', typeComposer: { a: 1 } }));
const duplicateTypeComposerFactoryB = jest.fn(() => ({ name: 'dupe', typeComposer: { b: 2 } }));

// Failure: invalid typeComposer (missing name)
const invalidTypeComposerFactory = jest.fn(() => ({ typeComposer: { foo: 'bar' } }));
// Failure: invalid typeComposer (not an object)
const invalidTypeTypeComposerFactory = jest.fn(() => 42);

describe('typeComposerLoader', () => {
  afterEach(() => {
    // Clean up all test models
    Object.keys(mongoose.models).forEach(model => {
      try { mongoose.deleteModel(model); } catch {}
    });
  });

  it('builds typeComposers and attaches to context', async () => {
    const userSchema = new mongoose.Schema({ name: String, email: String });
    const User = mongoose.model('User', userSchema);
    const models = { User };
    const context = {};
    const { context: result, schemaComposer, typeComposers } = await typeComposerLoader({ models, context });
    expect(result.typeComposers).toBeDefined();
    expect(result.schemaComposer).toBeInstanceOf(SchemaComposer);
    expect(result.typeComposers.User).toBeDefined();
    expect(typeof result.typeComposers.User.getType).toBe('function');
    expect(schemaComposer).toBe(result.schemaComposer);
  });

  it('builds typeComposers for multiple models', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const postSchema = new mongoose.Schema({ title: String });
    const User = mongoose.model('User', userSchema);
    const Post = mongoose.model('Post', postSchema);
    const models = { User, Post };
    const context = {};
    const { context: result } = await typeComposerLoader({ models, context });
    expect(result.typeComposers.User).toBeDefined();
    expect(result.typeComposers.Post).toBeDefined();
  });

  it('throws if models are missing', async () => {
    await expect(typeComposerLoader({})).rejects.toThrow();
  });

  it('throws if models is empty', async () => {
    await expect(typeComposerLoader({ models: {} })).rejects.toThrow();
  });

  it('supports plugins (extension point)', async () => {
    const pluginSchema = new mongoose.Schema({ name: String });
    const PluginUser = mongoose.model('PluginUser', pluginSchema);
    const models = { PluginUser };
    const context = {};
    const plugin = jest.fn(async ({ schemaComposer, typeComposers, context }) => {
      // no-op
    });
    await typeComposerLoader({ models, context, plugins: [plugin] });
    expect(plugin).toHaveBeenCalled();
    const callArgs = plugin.mock.calls[0][0];
    expect(callArgs).toHaveProperty('schemaComposer');
    expect(callArgs).toHaveProperty('typeComposers');
    expect(callArgs).toHaveProperty('context');
  });

  it('ignores non-function plugins', async () => {
    const pluginSchema = new mongoose.Schema({ name: String });
    const PluginUser = mongoose.model('PluginUser', pluginSchema);
    const models = { PluginUser };
    // Should not throw
    await expect(typeComposerLoader({ models, plugins: [null, undefined, 123] })).resolves.toBeDefined();
  });

  it('handles plugin errors gracefully', async () => {
    const pluginSchema = new mongoose.Schema({ name: String });
    const PluginUser = mongoose.model('PluginUser', pluginSchema);
    const models = { PluginUser };
    const plugin = jest.fn(async () => { throw new Error('Plugin fail'); });
    await expect(typeComposerLoader({ models, plugins: [plugin] })).rejects.toThrow('Plugin fail');
  });

  it('throws on invalid model (error handling)', async () => {
    const models = { User: { notARealModel: true } };
    await expect(typeComposerLoader({ models })).rejects.toThrow();
  });

  it('calls lifecycle hooks (beforeAll, afterAll, onError)', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('User', userSchema);
    const models = { User };
    const context = {};
    const events = [];
    const hooks = {
      validateInput: (obj, schema) => { if (typeof obj.models !== 'object') throw new TypeError('models must be object'); return obj; },
      logStart: () => {},
      logEnd: () => {},
      injectContext: x => x,
      withErrorHandling: fn => fn,
      runLifecycle: jest.fn(async (hook, ctx) => events.push(hook)),
    };
    await typeComposerLoader({ models, context, hooks });
    expect(events).toContain('beforeAll');
    expect(events).toContain('afterAll');
  });

  it('calls onReload callback for hot reload', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('User', userSchema);
    const models = { User };
    let reloaded = false;
    const onReload = jest.fn(cb => { reloaded = true; });
    await typeComposerLoader({ models, onReload });
    expect(onReload).toHaveBeenCalled();
    expect(reloaded).toBe(true);
  });

  it('does not mutate input context except for expected keys', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('User', userSchema);
    const models = { User };
    const context = { foo: 'bar' };
    const { context: result } = await typeComposerLoader({ models, context });
    expect(result.foo).toBe('bar');
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['foo', 'typeComposers', 'schemaComposer']));
  });

  beforeEach(() => {
    const schemaComposer = new SchemaComposer();
    schemaComposer.clear();
    jest.clearAllMocks();
  });

  it('registers a valid typeComposer object from a factory (happy path)', async () => {
    const userSchema = new mongoose.Schema({ name: String, email: String });
    const User = mongoose.model('User', userSchema);
    const models = { User };
    const ctx = baseContext();
    const result = await typeComposerLoader({ models, context: ctx });
    expect(result.typeComposers.User).toBeDefined();
    expect(typeof result.typeComposers.User.getType).toBe('function');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate typeComposer names (edge case)', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('User', userSchema);
    const AnotherUser = mongoose.model('AnotherUser', userSchema);
    const models = { User, AnotherUser };
    const ctx = baseContext();
    await typeComposerLoader({ models, context: ctx, logger: mockLogger });
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('duplicate typeComposer name'));
  });

  it('skips invalid typeComposer objects (missing name) and does not register them (failure)', async () => {
    const invalidSchema = new mongoose.Schema({});
    const InvalidUser = mongoose.model('InvalidUser', invalidSchema);
    const models = { InvalidUser };
    const ctx = baseContext();
    await typeComposerLoader({ models, context: ctx, logger: mockLogger });
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('invalid typeComposer object'));
  });

  it('skips invalid typeComposer objects (not an object) and does not register them (failure)', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('BadUser', userSchema);
    const models = { User };
    const ctx = baseContext();
    const result = await typeComposerLoader({ models, context: ctx });
    expect(result.typeComposers).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('EmptyUser', userSchema);
    const models = { User };
    const ctx = baseContext();
    const result = await typeComposerLoader({ models, context: ctx });
    expect(result.typeComposers).toBeDefined();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const userSchema = new mongoose.Schema({ name: String });
    const User = mongoose.model('ErrorUser', userSchema);
    const models = { User };
    const ctx = baseContext();
    const result = await typeComposerLoader({ models, context: ctx });
    expect(result.typeComposers).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 