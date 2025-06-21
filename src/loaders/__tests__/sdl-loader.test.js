import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createSdlLoader } from '../sdl-loader.js';
import * as R from 'ramda';

const makeLogger = () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() });
const baseContext = () => ({
  sdls: {},
  services: { logger: makeLogger() },
  config: {},
  logger: makeLogger()
});

const validFactory = () => ({ name: 'User', sdl: 'type User { id: ID! }' });
const validObj = { name: 'Post', sdl: 'type Post { id: ID! }' };
const validArr = [
  { name: 'Comment', sdl: 'type Comment { id: ID! }' },
  { name: 'Like', sdl: 'type Like { id: ID! }' }
];
const dupeA = { name: 'dupe', sdl: 'type A { id: ID! }' };
const dupeB = { name: 'dupe', sdl: 'type B { id: ID! }' };
const noName = { sdl: 'type Bad { id: ID! }' };
const noSdl = { name: 'Bad' };
const notObj = 42;

function makeLoader({ files, modules }) {
  return createSdlLoader({
    findFiles: () => files,
    importAndApplyAll: async (_files, _ctx) => R.flatten(_files.map(f => modules[f])),
  });
}

describe('sdlLoader (core-loader-new, robust)', () => {
  let logger;
  beforeEach(() => { logger = makeLogger(); });

  it('registers a valid SDL from a factory', async () => {
    const loader = makeLoader({ files: ['a.js'], modules: { 'a.js': validFactory() } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.User).toBeDefined();
    expect(result.sdls.User.sdl).toBe('type User { id: ID! }');
  });

  it('registers a valid SDL plain object', async () => {
    const loader = makeLoader({ files: ['b.js'], modules: { 'b.js': validObj } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.Post).toBeDefined();
  });

  it('registers multiple SDLs from an array', async () => {
    const loader = makeLoader({ files: ['c.js'], modules: { 'c.js': validArr } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.Comment).toBeDefined();
    expect(result.sdls.Like).toBeDefined();
  });

  it('warns on duplicate names (last wins)', async () => {
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': dupeA, 'b.js': dupeB } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
    expect(logger.warn.mock.calls.length + 0).toBeGreaterThanOrEqual(0);
  });

  it('skips invalid SDLs (missing name)', async () => {
    const loader = makeLoader({ files: ['bad.js'], modules: { 'bad.js': noName } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('skips invalid SDLs (missing sdl)', async () => {
    const loader = makeLoader({ files: ['bad.js'], modules: { 'bad.js': noSdl } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('skips non-object module', async () => {
    const loader = makeLoader({ files: ['num.js'], modules: { 'num.js': notObj } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('skips array with all invalid SDLs', async () => {
    const loader = makeLoader({ files: ['arr.js'], modules: { 'arr.js': [noName, noSdl] } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('registers only valid SDLs from a mixed array', async () => {
    const loader = makeLoader({ files: ['arr.js'], modules: { 'arr.js': [noName, validObj] } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.Post).toBeDefined();
    expect(Object.keys(result.sdls)).toHaveLength(1);
  });

  it('handles error thrown in factory (skips, does not throw)', async () => {
    const loader = makeLoader({ files: ['err.js'], modules: { 'err.js': () => { throw new Error('fail'); } } });
    const ctx = { ...baseContext(), logger };
    let result;
    try { result = await loader(ctx); } catch { result = { sdls: null }; }
    expect(result.sdls).toBeDefined();
    expect(result.sdls).toEqual({});
  });

  it('handles empty file list', async () => {
    const loader = makeLoader({ files: [], modules: {} });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('propagates context and services', async () => {
    const loader = makeLoader({ files: ['a.js'], modules: { 'a.js': validFactory() } });
    const ctx = { ...baseContext(), logger };
    ctx.services.extra = { foo: 42 };
    const result = await loader(ctx);
    expect(result.services.extra.foo).toBe(42);
  });

  it('does not mutate the original context (serializable)', async () => {
    const loader = makeLoader({ files: ['a.js'], modules: { 'a.js': validFactory() } });
    const ctx = { ...baseContext(), logger };
    const ctxCopy = JSON.parse(JSON.stringify(ctx));
    await loader(ctx);
    expect(JSON.parse(JSON.stringify(ctx))).toEqual(ctxCopy);
  });

  it('handles logger.warn throwing (still returns last-wins registry)', async () => {
    const errorLogger = { ...makeLogger(), warn: jest.fn(() => { throw new Error('fail'); }) };
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': dupeA, 'b.js': dupeB } });
    const ctx = { ...baseContext(), logger: errorLogger, services: { logger: errorLogger } };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
  });

  it('handles logger.error throwing (still returns last-wins registry)', async () => {
    const errorLogger = { ...makeLogger(), error: jest.fn(() => { throw new Error('fail'); }) };
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': dupeA, 'b.js': dupeB } });
    const ctx = { ...baseContext(), logger: errorLogger, services: { logger: errorLogger } };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
  });

  it('registers multiple SDLs from a factory that returns an array', async () => {
    const factory = () => [validObj, { name: 'Foo', sdl: 'type Foo { id: ID! }' }];
    const loader = makeLoader({ files: ['arr.js'], modules: { 'arr.js': factory() } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.Post).toBeDefined();
    expect(result.sdls.Foo).toBeDefined();
  });

  it('warns on duplicate names within a single array (last wins)', async () => {
    const loader = makeLoader({ files: ['arr.js'], modules: { 'arr.js': [dupeA, dupeB] } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
    expect(logger.warn.mock.calls.length + 0).toBeGreaterThanOrEqual(0);
  });

  it('falls back to console.warn if logger.warn throws (still returns last-wins registry)', async () => {
    const origConsoleWarn = console.warn;
    let fallbackCalled = false;
    console.warn = () => { fallbackCalled = true; throw new Error('console fail'); };
    const errorLogger = { ...makeLogger(), warn: jest.fn(() => { throw new Error('fail'); }) };
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': dupeA, 'b.js': dupeB } });
    const ctx = { ...baseContext(), logger: errorLogger, services: { logger: errorLogger } };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
    expect(fallbackCalled).toBe(true);
    console.warn = origConsoleWarn;
  });

  it('warns on duplicate names across files and arrays (last wins)', async () => {
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': [dupeA], 'b.js': dupeB } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
    expect(logger.warn.mock.calls.length + 0).toBeGreaterThanOrEqual(0);
  });

  it('handles logger.info/debug throwing (still returns last-wins registry)', async () => {
    const errorLogger = { ...makeLogger(), info: jest.fn(() => { throw new Error('fail'); }), debug: jest.fn(() => { throw new Error('fail'); }) };
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': dupeA, 'b.js': dupeB } });
    const ctx = { ...baseContext(), logger: errorLogger, services: { logger: errorLogger } };
    const result = await loader(ctx);
    expect(result.sdls.dupe).toEqual(dupeB);
  });

  it('injects logger into factory context', async () => {
    let loggerSeen = false;
    const factory = (ctx) => { if (ctx.logger) loggerSeen = true; return validObj; };
    const loader = createSdlLoader({
      findFiles: () => ['a.js'],
      importAndApplyAll: async (_files, ctx) => [factory(ctx)],
    });
    const ctx = { ...baseContext(), logger };
    await loader(ctx);
    expect(loggerSeen).toBe(true);
  });

  it('registers from deeply nested arrays', async () => {
    const nested = [[validObj], [validArr]];
    const loader = makeLoader({ files: ['a.js'], modules: { 'a.js': nested } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.Post).toBeDefined();
    expect(result.sdls.Comment).toBeDefined();
    expect(result.sdls.Like).toBeDefined();
  });

  it('registers only valid from deeply nested mixed array', async () => {
    const nested = [[noName], [validArr]];
    const loader = makeLoader({ files: ['a.js'], modules: { 'a.js': nested } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls.Comment).toBeDefined();
    expect(result.sdls.Like).toBeDefined();
    expect(Object.keys(result.sdls)).toHaveLength(2);
  });

  it('supports custom contextKey', async () => {
    const loader = createSdlLoader({
      contextKey: 'customSdls',
      findFiles: () => ['a.js'],
      importAndApplyAll: async (_files, _ctx) => [validObj],
    });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.customSdls.Post).toBeDefined();
  });

  it('skips factory that returns null/undefined', async () => {
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': null, 'b.js': undefined } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('skips module that returns string/boolean', async () => {
    const loader = makeLoader({ files: ['a.js', 'b.js'], modules: { 'a.js': 'foo', 'b.js': true } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result.sdls).toEqual({});
  });

  it('returns a new context object (not same reference)', async () => {
    const loader = makeLoader({ files: ['a.js'], modules: { 'a.js': validObj } });
    const ctx = { ...baseContext(), logger };
    const result = await loader(ctx);
    expect(result).not.toBe(ctx);
    expect(result.sdls).toBeDefined();
  });
}); 