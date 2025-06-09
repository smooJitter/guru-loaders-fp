import { describe, it, expect, jest } from '@jest/globals';
import * as R from 'ramda';
import {
  createLoader,
  createLoaderWithPlugins,
  createLoaderWithMiddleware,
  createLoaderWithValidation,
  createLoaderWithTransformation,
  buildRegistry
} from '../loader-utils.js';

describe('loader-utils', () => {
  describe('buildRegistry', () => {
    it('returns merged registry from array of modules', () => {
      const modules = [
        { name: 'foo', a: 1 },
        { name: 'bar', b: 2 }
      ];
      const transform = (m) => m;
      const result = buildRegistry(modules, {}, transform);
      expect(result).toEqual({ foo: { name: 'foo', a: 1 }, bar: { name: 'bar', b: 2 } });
    });
    it('returns empty object for null/undefined input', () => {
      expect(buildRegistry(null, {}, () => {})).toEqual({});
      expect(buildRegistry(undefined, {}, () => {})).toEqual({});
    });
    it('returns empty object for non-object input', () => {
      expect(buildRegistry(42, {}, () => {})).toEqual({});
      expect(buildRegistry('foo', {}, () => {})).toEqual({});
    });
    it('skips non-object transforms', () => {
      const modules = [{ name: 'foo', foo: 1 }, { name: 'bar', bar: 2 }];
      const transform = () => undefined;
      expect(buildRegistry(modules, {}, transform)).toEqual({});
    });
    it('merges deeply', () => {
      const modules = [
        { name: 'foo', a: 1, nested: { x: 1 } },
        { name: 'foo', b: 2, nested: { y: 2 } }
      ];
      const transform = (m) => m;
      expect(buildRegistry(modules, {}, transform)).toEqual({
        foo: { name: 'foo', b: 2, nested: { y: 2 } }
      });
    });

    describe('buildRegistry (with logger)', () => {
      let logger, context;
      beforeEach(() => {
        logger = { debug: jest.fn(), error: jest.fn(), warn: jest.fn() };
        context = { services: { logger } };
      });

      it('calls logger.debug when input is not array/object', () => {
        buildRegistry(42, context, () => {});
        expect(logger.debug).toHaveBeenCalledWith(
          '[buildRegistry] Input is not an array/object, returning empty registry:',
          42
        );
      });

      it('calls logger.debug when skipping non-object module', () => {
        buildRegistry([null, undefined, 42], context, () => {});
        expect(logger.debug).toHaveBeenCalledWith(
          '[buildRegistry] Skipping non-object module:',
          null
        );
        expect(logger.debug).toHaveBeenCalledWith(
          '[buildRegistry] Skipping non-object module:',
          undefined
        );
        expect(logger.debug).toHaveBeenCalledWith(
          '[buildRegistry] Skipping non-object module:',
          42
        );
      });

      it('calls logger.error when skipping module missing name', () => {
        buildRegistry([{ foo: 1 }], context, (m) => m);
        expect(logger.error).toHaveBeenCalledWith(
          '[buildRegistry] Skipping module missing name:',
          { foo: 1 }
        );
      });

      it('calls logger.error when skipping module with invalid transform', () => {
        buildRegistry([{ name: 'foo' }], context, () => undefined);
        expect(logger.error).toHaveBeenCalledWith(
          '[buildRegistry] Skipping module with invalid transform:',
          undefined
        );
      });

      it('calls logger.warn when duplicate module name', () => {
        buildRegistry([
          { name: 'foo', a: 1 },
          { name: 'foo', b: 2 }
        ], context, (m) => m);
        expect(logger.warn).toHaveBeenCalledWith(
          '[buildRegistry] Duplicate module name: foo'
        );
      });
    });
  });

  describe('createLoader', () => {
    const mockModule = { name: 'foo', foo: 1 };
    const mockContext = { foo: {} };
    const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
    const mockFindFiles = jest.fn(() => ['file1.js']);
    const mockImportModule = jest.fn(async () => mockModule);
    const mockValidateModule = jest.fn(() => true);
    const mockValidateContext = jest.fn(async () => true);
    const mockValidateDependencies = jest.fn(async () => true);
    const mockValidateExports = jest.fn(async () => true);
    const mockDetectCircularDeps = jest.fn(() => false);

    it('loads and registers modules (happy path)', async () => {
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => true,
        validateModule: mockValidateModule,
        validateContext: mockValidateContext,
        validateDependencies: mockValidateDependencies,
        validateExports: mockValidateExports,
        transform: (m) => m
      });
      const context = { foo: {} };
      const { context: result } = await loader(context);
      expect(result.foo).toEqual({ foo: { name: 'foo', foo: 1 } });
    });

    it('skips validation if validate: false', async () => {
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: false,
        transform: (m) => m
      });
      const context = { foo: {} };
      const { context: result } = await loader(context);
      expect(result.foo).toEqual({ foo: { name: 'foo', foo: 1 } });
    });

    it('filters out modules with custom validate', async () => {
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => false,
        transform: (m) => m
      });
      const context = { foo: {} };
      const { context: result } = await loader(context);
      expect(result.foo).toEqual({});
    });

    it('applies custom transform', async () => {
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => true,
        transform: (m) => ({ name: 'bar', bar: m.foo })
      });
      const context = { foo: {} };
      const { context: result } = await loader(context);
      expect(result.foo).toEqual({ bar: { name: 'bar', bar: 1 } });
    });

    it('logs and throws on dependency validation error', async () => {
      const errorLogger = { ...mockLogger, error: jest.fn() };
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: errorLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => true,
        validateDependencies: jest.fn(async () => { throw new Error('dep fail'); }),
        validateExports: mockValidateExports
      });
      await expect(loader({ foo: {} })).rejects.toThrow('dep fail');
      expect(errorLogger.error).toHaveBeenCalled();
    });

    it('logs and throws on export validation error', async () => {
      const errorLogger = { ...mockLogger, error: jest.fn() };
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: errorLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => true,
        validateDependencies: mockValidateDependencies,
        validateExports: jest.fn(async () => { throw new Error('export fail'); })
      });
      await expect(loader({ foo: {} })).rejects.toThrow('export fail');
      expect(errorLogger.error).toHaveBeenCalled();
    });

    it('throws on circular dependencies', async () => {
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => true,
        detectCircularDeps: () => true
      });
      await expect(loader({ foo: {} })).rejects.toThrow('Circular dependencies detected');
    });

    it('returns empty registry for non-object modules', async () => {
      const badImportModule = jest.fn(async () => 42);
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: badImportModule,
        validate: (type, module) => true,
        transform: (m) => m
      });
      const context = { foo: {} };
      const { context: result } = await loader(context);
      expect(result.foo).toEqual({});
    });

    it('hot reload setup returns cleanup when watch is false', async () => {
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: mockLogger,
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        validate: (type, module) => true,
        watch: false
      });
      const context = { foo: {} };
      const { cleanup } = await loader(context);
      expect(typeof cleanup).toBe('function');
    });

    it('logs and throws if importModule throws', async () => {
      const errorLogger = { ...mockLogger, error: jest.fn() };
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: errorLogger,
        findFiles: mockFindFiles,
        importModule: () => { throw new Error('fail'); },
        validate: false
      });
      await expect(loader({ foo: {} })).rejects.toThrow('fail');
      expect(errorLogger.error).toHaveBeenCalled();
    });

    it('logs error if hot reload fails', async () => {
      const errorLogger = { ...mockLogger, error: jest.fn() };
      // Patch watchFiles to immediately call the callback with an error
      const fakeWatchFiles = (patterns, cb) => {
        cb('change', 'file1.js');
        return () => {};
      };
      const loader = createLoader('foo', {
        patterns: ['*.js'],
        logger: errorLogger,
        findFiles: mockFindFiles,
        importModule: () => { throw new Error('reload fail'); },
        validate: false,
        watch: true,
        // Inject fake watchFiles
        __proto__: { watchFiles: fakeWatchFiles }
      });
      // Call loader to trigger hot reload setup
      await expect(loader({ foo: {} })).rejects.toThrow('reload fail');
      expect(errorLogger.error).toHaveBeenCalled();
    });
  });

  describe('createLoaderWithPlugins', () => {
    it('runs before and after plugins', async () => {
      const before = jest.fn(ctx => ({ ...ctx, before: true }));
      const after = jest.fn(ctx => ({ ...ctx, after: true }));
      const loader = createLoaderWithPlugins('foo', [
        { before, after }
      ], {
        findFiles: () => [],
        importModule: async () => ({}),
        logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
      });
      const { context } = await loader({ foo: {} });
      expect(context.before).toBe(true);
      expect(context.after).toBe(true);
    });
  });

  describe('createLoaderWithMiddleware', () => {
    it('runs middleware before loader', async () => {
      const middleware = [jest.fn(ctx => ({ ...ctx, mw: 1 }))];
      const loader = createLoaderWithMiddleware('foo', middleware, {
        findFiles: () => [],
        importModule: async () => ({}),
        logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
      });
      const { context } = await loader({ foo: {} });
      expect(context.mw).toBe(1);
    });
  });

  describe('createLoaderWithValidation', () => {
    it('runs validators before loader', async () => {
      const validator = jest.fn(async ctx => ctx);
      const loader = createLoaderWithValidation('foo', [validator], {
        findFiles: () => [],
        importModule: async () => ({}),
        logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
      });
      await loader({ foo: {} });
      expect(validator).toHaveBeenCalled();
    });
  });

  describe('createLoaderWithTransformation', () => {
    it('runs transformers before loader', async () => {
      const transformer = jest.fn(ctx => ({ ...ctx, t: 2 }));
      const loader = createLoaderWithTransformation('foo', [transformer], {
        findFiles: () => [],
        importModule: async () => ({}),
        logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
      });
      const { context } = await loader({ foo: {} });
      expect(context.t).toBe(2);
    });
  });
}); 