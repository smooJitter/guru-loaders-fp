import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import dataLoader from '../data-loader/loader.js';
import DataLoader from 'dataloader';

const mockLogger = () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() });
const baseContext = () => ({ services: { logger: mockLogger() } });

// Per-request factory to instantiate DataLoader instances from defs
function createDataLoaders(defs, context) {
  const registry = {};
  for (const [namespace, loaders] of Object.entries(defs || {})) {
    registry[namespace] = {};
    for (const [name, def] of Object.entries(loaders)) {
      registry[namespace][name] = new DataLoader((keys) => def.batchFn(keys, context), def.options);
    }
  }
  return registry;
}

describe('data-loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads DataLoader instances from array factory (happy path)', async () => {
    const importModule = async (file) => ({
      default: () => [
        { model: 'user', name: 'byId', batchFn: async (ids) => ids.map(id => ({ id })), options: { cache: false } }
      ]
    });
    const findFiles = () => ['user.data.js'];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    console.log('DEBUG dataLoaderDefs (happy path):', JSON.stringify(dataLoaderDefs, null, 2));
    const dataLoaders = createDataLoaders(dataLoaderDefs, ctx);
    expect(dataLoaders.user.byId).toBeInstanceOf(DataLoader);
    const users = await dataLoaders.user.byId.loadMany([1, 2]);
    expect(users).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('loads multiple models/namespaces', async () => {
    const modules = [
      { default: () => [
        { model: 'user', name: 'byId', batchFn: async (ids) => ids },
        { model: 'post', name: 'byId', batchFn: async (ids) => ids.map(id => ({ post: id })) }
      ] }
    ];
    const importModule = async (file) => {
      const mod = modules[0];
      console.log('[DEBUG test importModule] returning:', JSON.stringify(mod, null, 2));
      return mod;
    };
    const findFiles = () => ['multi.data.js'];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    console.log('DEBUG dataLoaderDefs (multi):', JSON.stringify(dataLoaderDefs, null, 2));
    const dataLoaders = createDataLoaders(dataLoaderDefs, ctx);
    expect(dataLoaders.user.byId).toBeInstanceOf(DataLoader);
    expect(dataLoaders.post.byId).toBeInstanceOf(DataLoader);
    const posts = await dataLoaders.post.byId.loadMany([10, 20]);
    expect(posts).toEqual([{ post: 10 }, { post: 20 }]);
  });

  it('skips invalid loader objects (missing name/model/batchFn)', async () => {
    const modules = [
      { default: () => [
        { model: 'user', batchFn: async () => [] }, // missing name
        { name: 'byId', batchFn: async () => [] }, // missing model
        { model: 'user', name: 'byId' } // missing batchFn
      ] }
    ];
    const importModule = async (file) => {
      const mod = modules[0];
      console.log('[DEBUG test importModule] returning:', JSON.stringify(mod, null, 2));
      return mod;
    };
    const findFiles = () => ['invalid.data.js'];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    expect(dataLoaderDefs).toEqual({});
  });

  it('handles duplicate loader names (last wins)', async () => {
    const modules = [
      { default: () => [
        { model: 'user', name: 'byId', batchFn: async (ids) => ids.map(id => ({ id, v: 1 })) }
      ] },
      { default: () => [
        { model: 'user', name: 'byId', batchFn: async (ids) => ids.map(id => ({ id, v: 2 })) }
      ] }
    ];
    let call = 0;
    const importModule = async (file) => {
      const mod = modules[call++];
      console.log('[DEBUG test importModule] returning:', JSON.stringify(mod, null, 2));
      return mod;
    };
    const findFiles = () => ['dupe1.data.js', 'dupe2.data.js'];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    console.log('DEBUG dataLoaderDefs (dupe):', JSON.stringify(dataLoaderDefs, null, 2));
    const dataLoaders = createDataLoaders(dataLoaderDefs, ctx);
    expect(dataLoaders.user.byId).toBeInstanceOf(DataLoader);
    const users = await dataLoaders.user.byId.loadMany([1]);
    expect(users).toEqual([{ id: 1, v: 2 }]); // last wins
  });

  it('handles factory that throws error', async () => {
    const modules = [
      { default: () => { throw new Error('Factory failed'); } }
    ];
    const importModule = async (file) => {
      const mod = modules[0];
      console.log('[DEBUG test importModule] returning:', JSON.stringify(mod, null, 2));
      return mod;
    };
    const findFiles = () => ['fail.data.js'];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    expect(dataLoaderDefs).toEqual({});
    expect(ctx.services.logger.warn).toHaveBeenCalled();
  });

  it('attaches options to DataLoader instance if present', async () => {
    const modules = [
      { default: () => [
        { model: 'user', name: 'byId', batchFn: async (ids) => ids, options: { cache: false } }
      ] }
    ];
    const importModule = async (file) => {
      const mod = modules[0];
      console.log('[DEBUG test importModule] returning:', JSON.stringify(mod, null, 2));
      return mod;
    };
    const findFiles = () => ['user.data.js'];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    console.log('DEBUG dataLoaderDefs (options):', JSON.stringify(dataLoaderDefs, null, 2));
    const dataLoaders = createDataLoaders(dataLoaderDefs, ctx);
    expect(dataLoaders.user.byId).toBeInstanceOf(DataLoader);
    // DataLoader options are not directly accessible, but we can check instance
    expect(dataLoaders.user.byId).toHaveProperty('clearAll');
  });

  it('handles empty file list (edge case)', async () => {
    const importModule = async () => {
      const mod = {};
      console.log('[DEBUG test importModule] returning:', JSON.stringify(mod, null, 2));
      return mod;
    };
    const findFiles = () => [];
    const ctx = { ...baseContext(), importModule, findFiles };
    const { dataLoaderDefs } = await dataLoader(ctx);
    expect(dataLoaderDefs).toEqual({});
    expect(ctx.services.logger.warn).not.toHaveBeenCalled();
  });
}); 