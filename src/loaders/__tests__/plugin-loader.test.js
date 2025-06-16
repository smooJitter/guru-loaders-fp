import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { pluginLoader } from '../plugin-loader.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const baseContext = () => ({
  plugins: {},
  services: {},
  config: {},
  logger: mockLogger
});

// Happy path: valid plugin
const validPlugin = { name: 'testPlugin', version: '1.0.0', hooks: {}, options: {} };
// Edge: duplicate name
const duplicatePluginA = { name: 'dupe', version: '1.0.0', hooks: {}, options: {} };
const duplicatePluginB = { name: 'dupe', version: '2.0.0', hooks: {}, options: {} };
// Failure: missing name
const invalidPlugin = { version: '1.0.0', hooks: {}, options: {} };
// Failure: invalid type for hooks
const invalidTypePlugin = { name: 'bad', version: '1.0.0', hooks: 42, options: {} };

describe('pluginLoader', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('registers a valid plugin (happy path)', async () => {
    const files = ['test.plugin.js'];
    const modules = { 'test.plugin.js': validPlugin };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pluginLoader(ctx);
    expect(result.plugins.testPlugin).toBeDefined();
    expect(result.plugins.testPlugin.version).toBe('1.0.0');
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('warns on duplicate plugin names (edge case)', async () => {
    const files = ['dupeA.plugin.js', 'dupeB.plugin.js'];
    const modules = {
      'dupeA.plugin.js': duplicatePluginA,
      'dupeB.plugin.js': duplicatePluginB
    };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pluginLoader(ctx);
    expect(result.plugins.dupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid plugin objects (missing name) and does not register them (failure)', async () => {
    const files = ['bad.plugin.js'];
    const modules = { 'bad.plugin.js': invalidPlugin };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pluginLoader(ctx);
    expect(result.plugins).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('skips invalid plugin objects (invalid type) and does not register them (failure)', async () => {
    const files = ['badtype.plugin.js'];
    const modules = { 'badtype.plugin.js': invalidTypePlugin };
    const ctx = baseContext();
    ctx.options = {
      importModule: async (file, ctx) => modules[file],
      findFiles: () => files
    };
    const result = await pluginLoader(ctx);
    expect(result.plugins).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('handles empty file list (edge case)', async () => {
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => ({}),
      findFiles: () => []
    };
    const result = await pluginLoader(ctx);
    expect(result.plugins).toEqual({});
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('handles import errors gracefully (failure path)', async () => {
    const files = ['fail.plugin.js'];
    const ctx = baseContext();
    ctx.options = {
      importModule: async () => { throw new Error('fail'); },
      findFiles: () => files
    };
    const result = await pluginLoader(ctx);
    expect(result.plugins).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
}); 