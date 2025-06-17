import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { modelLoader } from '../model-loader.js';
import mongoose from 'mongoose';

jest.mock('mongoose');

const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
};

// Realistic fake Mongoose model
const fakeMongooseModel = {
  modelName: 'User',
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};
// Happy path: model as factory function
const validModelFactory = jest.fn(() => fakeMongooseModel);
// Edge: invalid model (missing modelName)
const invalidModel = { schema: { foo: 'bar' } };
// Failure: not an object or function
const invalidExport = 42;

// Factory function that throws
const throwingFactory = jest.fn(() => { throw new Error('Factory error'); });

// Model with duplicate name
const duplicateModelA = { modelName: 'DupModel', schema: { a: 1 } };
const duplicateModelB = { modelName: 'DupModel', schema: { b: 2 } };

// Edge: duplicate name factories
const duplicateModelFactoryA = jest.fn(() => ({ modelName: 'dupe', schema: { a: 1 }, find: jest.fn() }));
const duplicateModelFactoryB = jest.fn(() => ({ modelName: 'dupe', schema: { b: 2 }, find: jest.fn() }));

// Failure: invalid model (missing name)
const invalidModelFactory = jest.fn(() => ({ schema: { foo: 'bar' } }));
// Failure: invalid model (not an object)
const invalidTypeModelFactory = jest.fn(() => 42);

const makeFakeModel = (name) => ({
  modelName: name,
  schema: { fake: true },
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
});

// Helper: create a factory that registers a model in mongooseConnection and returns the result
// Context7 MCP best practice: factory accepts context argument
const makeRegisteringFactory = (name) => (context) => {
  if (!context || !context.mongooseConnection) {
    console.error(`[factory] ERROR: No mongooseConnection in context for ${name}`, context);
    throw new Error('No mongooseConnection in context');
  }
  const mongooseConnection = context.mongooseConnection;
  // Always call mongoose.model (let the loader handle duplicates)
  return mongooseConnection.model(name, { fake: true });
};

describe('modelLoader (Mongoose-centric)', () => {
  let originalModels;
  let originalModelFn;

  beforeEach(() => {
    // Always reset mongoose models and mock implementation before each test
    mongoose.models = {};
    mongoose.model = jest.fn((name, schema) => {
      console.log('[MOCK] mongoose.model called for', name);
      // Always return a valid model object, and always set schema
      if (!mongoose.models[name]) {
        mongoose.models[name] = {
          modelName: name,
          schema,
          findById: jest.fn(),
        };
      } else {
        // Always set schema if provided
        if (schema) mongoose.models[name].schema = schema;
      }
      return mongoose.models[name];
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset all mocks and clear mongoose models after each test
    jest.resetAllMocks();
    mongoose.models = {};
  });

  it('registers a valid model from a factory', async () => {
    // Use a unique model name for this test
    const files = ['UserFactoryA.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: makeRegisteringFactory('UserFactoryA') }),
      options: { patterns: files },
    };
    // Ensure the model is not pre-registered and mocks are clear
    delete mongoose.models['UserFactoryA'];
    jest.clearAllMocks();
    const result = await modelLoader(ctx);
    expect(result.models.UserFactoryA).toBeDefined();
    expect(result.models.UserFactoryA.modelName).toBe('UserFactoryA');
    expect(typeof result.models.UserFactoryA.findById).toBe('function');
    // Should NOT log a duplicate warning for first registration
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('registers a valid direct model export', async () => {
    const files = ['UniqueProduct.model.js'];
    const modelObj = {
      modelName: 'UniqueProduct',
      schema: { fake: true },
      findById: jest.fn(),
    };
    // Register the model in mongoose.models so the loader can find it
    mongoose.models['UniqueProduct'] = modelObj;
    const testCtx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({
        default: modelObj,
      }),
      options: { patterns: files },
    };
    const result = await modelLoader(testCtx);
    expect(result.models.UniqueProduct).toBeDefined();
    expect(result.models.UniqueProduct.modelName).toBe('UniqueProduct');
    expect(typeof result.models.UniqueProduct.findById).toBe('function');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[model-loader]',
      expect.stringContaining('Duplicate model name: UniqueProduct')
    );
  });

  it('logs a warning and uses existing model for duplicates', async () => {
    const fakeModel = makeFakeModel('Dupe');
    mongoose.models.Dupe = fakeModel;
    const factory = jest.fn(() => fakeModel);
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => ['Dupe.model.js'],
      importModule: async (file) => {
        const mod = { default: factory };
        console.log('[test] importModule returning for', file, ':', mod);
        return mod;
      },
      options: {
        patterns: ['Dupe.model.js'],
      },
    };
    const result = await modelLoader(ctx);
    console.log('logs a warning and uses existing model for duplicates result:', result);
    expect(result.models.Dupe).toBeDefined();
    expect(result.models.Dupe.modelName).toBe('Dupe');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[model-loader]',
      expect.stringContaining('Duplicate model name: Dupe')
    );
  });

  it('logs a warning if factory throws and skips the model', async () => {
    // Create the factory once
    const factory = jest.fn(() => { throw new Error('Factory error'); });
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => ['Throw.model.js'],
      importModule: async (file) => {
        const mod = { default: factory };
        console.log('[test] importModule returning for', file, ':', mod);
        return mod;
      },
      options: {
        patterns: ['Throw.model.js'],
      },
    };
    const result = await modelLoader(ctx);
    console.log('logs a warning if factory throws and skips the model result:', result);
    expect(result.models.Throw).toBeUndefined();
    // Expect both the error log and the drop warning
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[model-loader]',
      expect.stringContaining('Error loading model: Factory error')
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('returns an empty registry if no valid models are found', async () => {
    const files = ['Empty.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: {} }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    // Should log a warning for dropped/invalid module
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('returns an error if the loader throws fatally', async () => {
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => { throw new Error('fail'); },
      importModule: async (file) => { throw new Error('should not be called'); },
      options: { patterns: ['fail.model.js'] },
    };
    const result = await modelLoader(ctx);
    expect(result.error).toBeNull();
    expect(result.models).toEqual({});
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[models-loader]'),
      expect.any(Error)
    );
  });

  it('works with missing mongooseConnection (uses default)', async () => {
    const factory = makeRegisteringFactory('User');
    const files = ['User.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      findFiles: () => files,
      importModule: async (file) => ({ default: factory }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeDefined();
    expect(result.models.User.modelName).toBe('User');
  });

  it('works with missing options.patterns (uses default)', async () => {
    const factory = makeRegisteringFactory('User');
    const files = ['User.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: factory }),
      options: {},
    };
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeDefined();
    expect(result.models.User.modelName).toBe('User');
  });

  it('works with missing options.findFiles (uses default)', async () => {
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      options: { patterns: ['User.model.js'] },
    };
    // Should not throw
    await modelLoader(ctx);
  });

  it('works with missing options.importModule (uses default)', async () => {
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      options: { patterns: ['User.model.js'] },
    };
    // Should not throw
    await modelLoader(ctx);
  });

  it('logs a warning and only keeps one when duplicate model names are found', async () => {
    const files = ['User1.model.js', 'User2.model.js'];
    // Both factories must return valid model objects
    const factory1 = makeRegisteringFactory('User');
    const factory2 = makeRegisteringFactory('User');
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: file === 'User1.model.js' ? factory1 : factory2 }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(Object.keys(result.models)).toEqual(['User']);
    expect(result.models.User).toBeDefined();
    expect(result.models.User.modelName).toBe('User');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[model-loader]',
      expect.stringContaining('Duplicate model name: User')
    );
  });

  it('loads multiple valid models in one run', async () => {
    const files = ['UserA.model.js', 'ProductA.model.js'];
    // Create factories once
    const userAFactory = (context) => {
      console.log('[DEBUG] userAFactory called with context:', context);
      return makeRegisteringFactory('UserA')(context);
    };
    const productAFactory = (context) => {
      console.log('[DEBUG] productAFactory called with context:', context);
      return makeRegisteringFactory('ProductA')(context);
    };
    console.log('[DEBUG] mongoose.models before:', Object.keys(mongoose.models));
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({
        default: file === 'UserA.model.js' ? userAFactory : productAFactory
      }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    console.log('[DEBUG] mongoose.models after:', Object.keys(mongoose.models));
    console.log('[DEBUG] result.models:', Object.keys(result.models));
    expect(Object.keys(result.models).sort()).toEqual(['ProductA', 'UserA']);
    expect(result.models.UserA).toBeDefined();
    expect(result.models.ProductA).toBeDefined();
  });

  it('continues loading if importModule throws for one file', async () => {
    const files = ['UserA.model.js', 'BrokenA.model.js', 'ProductA.model.js'];
    // Create factories once
    const userAFactory = (context) => {
      console.log('[DEBUG] userAFactory called with context:', context);
      return makeRegisteringFactory('UserA')(context);
    };
    const productAFactory = (context) => {
      console.log('[DEBUG] productAFactory called with context:', context);
      return makeRegisteringFactory('ProductA')(context);
    };
    console.log('[DEBUG] mongoose.models before:', Object.keys(mongoose.models));
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => {
        if (file === 'BrokenA.model.js') throw new Error('Import failed');
        return {
          default: file === 'UserA.model.js' ? userAFactory : productAFactory
        };
      },
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    console.log('[DEBUG] mongoose.models after:', Object.keys(mongoose.models));
    console.log('[DEBUG] result.models:', Object.keys(result.models));
    expect(Object.keys(result.models).sort()).toEqual(['ProductA', 'UserA']);
    expect(result.models.UserA).toBeDefined();
    expect(result.models.ProductA).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to import module'),
      expect.any(Error)
    );
  });

  it('returns a cleanup function that is callable', async () => {
    const files = ['User.model.js'];
    const userFactory = makeRegisteringFactory('User');
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: userFactory }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(typeof result.cleanup).toBe('function');
    // Should be callable without error
    expect(() => result.cleanup()).not.toThrow();
  });

  it('drops a primitive export (number)', async () => {
    const files = ['Primitive.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: 42 }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('drops a model with missing or invalid findById', async () => {
    const files = ['NoFindById.model.js', 'InvalidFindById.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => file === 'NoFindById.model.js'
        ? { default: { modelName: 'NoFindById', schema: { fake: true } } }
        : { default: { modelName: 'InvalidFindById', schema: { fake: true }, findById: 123 } },
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('drops when factory returns null or undefined', async () => {
    const files = ['NullFactory.model.js', 'UndefinedFactory.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: () => file === 'NullFactory.model.js' ? null : undefined }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('handles async factory (should be dropped or error)', async () => {
    const files = ['AsyncFactory.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: async () => makeFakeModel('AsyncFactory') }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('handles duplicate direct model exports', async () => {
    const files = ['DirectA.model.js', 'DirectB.model.js'];
    const modelObj = { modelName: 'DirectDupe', schema: { fake: true }, findById: jest.fn() };
    mongoose.models['DirectDupe'] = modelObj;
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: modelObj }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models.DirectDupe).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[model-loader]',
      expect.stringContaining('Duplicate model name: DirectDupe')
    );
  });

  it('falls back to console if logger missing', async () => {
    const files = ['NoLogger.model.js'];
    global.console.warn = jest.fn();
    const ctx = {
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: 42 }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(global.console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('cleanup function removes models from mongoose.models', async () => {
    const files = ['CleanupTest.model.js'];
    const userFactory = makeRegisteringFactory('CleanupTest');
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: userFactory }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(mongoose.models.CleanupTest).toBeDefined();
    result.cleanup();
    expect(mongoose.models.CleanupTest).toBeUndefined();
  });
});

describe('modelLoader edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('works with missing mongooseConnection (uses default)', async () => {
    const files = ['User.model.js'];
    const modules = { 'User.model.js': { default: validModelFactory } };
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => modules[file],
      options: {
        patterns: files,
      },
    };
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeUndefined();
  });
  it('works with missing options.patterns (uses default)', async () => {
    const files = ['User.model.js'];
    const modules = { 'User.model.js': { default: validModelFactory } };
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => modules[file],
      options: {
        patterns: files,
      },
    };
    delete ctx.options.patterns;
    const result = await modelLoader(ctx);
    expect(result.models.User).toBeUndefined();
  });
  it('works with missing options.findFiles (uses default)', async () => {
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      options: {
        patterns: ['User.model.js'],
      },
    };
    // Should not throw
    await modelLoader(ctx);
  });
  it('works with missing options.importModule (uses default)', async () => {
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      options: {
        patterns: ['User.model.js'],
      },
    };
    // Should not throw
    await modelLoader(ctx);
  });
});

describe('modelLoader robustness and edge cases', () => {
  beforeEach(() => {
    mongoose.models = {};
    mongoose.model = jest.fn((name, schema) => {
      console.log('[MOCK] mongoose.model called for', name);
      if (!mongoose.models[name]) {
        mongoose.models[name] = {
          modelName: name,
          schema,
          findById: jest.fn(),
        };
      } else {
        if (schema) mongoose.models[name].schema = schema;
      }
      return mongoose.models[name];
    });
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.resetAllMocks();
    mongoose.models = {};
  });

  it('skips modules missing modelName', async () => {
    const files = ['NoName.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: { schema: { fake: true }, findById: jest.fn() } }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('skips modules missing schema', async () => {
    const files = ['NoSchema.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: { modelName: 'NoSchema', findById: jest.fn() } }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('skips modules that fail validation', async () => {
    // Simulate a model that passes transform but fails validation (e.g., missing findById)
    const files = ['Invalid.model.js'];
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: { modelName: 'Invalid', schema: { fake: true } } }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(result.models).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Dropped invalid or failed module during preTransform.')
    );
  });

  it('loads multiple valid models in one run', async () => {
    const files = ['UserA.model.js', 'ProductA.model.js'];
    // Create factories once
    const userAFactory = (context) => {
      console.log('[DEBUG] userAFactory called with context:', context);
      return makeRegisteringFactory('UserA')(context);
    };
    const productAFactory = (context) => {
      console.log('[DEBUG] productAFactory called with context:', context);
      return makeRegisteringFactory('ProductA')(context);
    };
    console.log('[DEBUG] mongoose.models before:', Object.keys(mongoose.models));
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({
        default: file === 'UserA.model.js' ? userAFactory : productAFactory
      }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    console.log('[DEBUG] mongoose.models after:', Object.keys(mongoose.models));
    console.log('[DEBUG] result.models:', Object.keys(result.models));
    expect(Object.keys(result.models).sort()).toEqual(['ProductA', 'UserA']);
    expect(result.models.UserA).toBeDefined();
    expect(result.models.ProductA).toBeDefined();
  });

  it('continues loading if importModule throws for one file', async () => {
    const files = ['UserA.model.js', 'BrokenA.model.js', 'ProductA.model.js'];
    // Create factories once
    const userAFactory = (context) => {
      console.log('[DEBUG] userAFactory called with context:', context);
      return makeRegisteringFactory('UserA')(context);
    };
    const productAFactory = (context) => {
      console.log('[DEBUG] productAFactory called with context:', context);
      return makeRegisteringFactory('ProductA')(context);
    };
    console.log('[DEBUG] mongoose.models before:', Object.keys(mongoose.models));
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => {
        if (file === 'BrokenA.model.js') throw new Error('Import failed');
        return {
          default: file === 'UserA.model.js' ? userAFactory : productAFactory
        };
      },
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    console.log('[DEBUG] mongoose.models after:', Object.keys(mongoose.models));
    console.log('[DEBUG] result.models:', Object.keys(result.models));
    expect(Object.keys(result.models).sort()).toEqual(['ProductA', 'UserA']);
    expect(result.models.UserA).toBeDefined();
    expect(result.models.ProductA).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to import module'),
      expect.any(Error)
    );
  });

  it('returns a cleanup function that is callable', async () => {
    const files = ['User.model.js'];
    const userFactory = makeRegisteringFactory('User');
    const ctx = {
      services: { logger: mockLogger },
      mongooseConnection: mongoose,
      findFiles: () => files,
      importModule: async (file) => ({ default: userFactory }),
      options: { patterns: files },
    };
    const result = await modelLoader(ctx);
    expect(typeof result.cleanup).toBe('function');
    // Should be callable without error
    expect(() => result.cleanup()).not.toThrow();
  });
}); 