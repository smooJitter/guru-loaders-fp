import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { typeComposerLoader } from '../type-composer-loader/index.js';
import { populateTypeComposers } from '../type-composer-loader/populateTypeComposers.js';
import { SchemaComposer } from 'graphql-compose';

// Mock dependencies
const mockValidateInput = jest.fn((module, schema) => {
  if (module.models && Object.keys(module.models).length === 0) {
    throw new Error('No models provided');
  }
  return module;
});

const mockRunLifecycle = jest.fn();

const mockCreateLoader = jest.fn((type, options) => {
  return async (ctx) => ({
    context: ctx,
    cleanup: jest.fn(),
  });
});

const mockGetLoaderLogger = jest.fn(() => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock the modules
jest.mock('../../hooks/index.js', () => ({
  validateInput: mockValidateInput,
  runLifecycle: mockRunLifecycle,
}));

jest.mock('../../utils/loader-utils.js', () => ({
  createLoader: mockCreateLoader,
}));

jest.mock('../../utils/loader-logger.js', () => ({
  getLoaderLogger: mockGetLoaderLogger,
}));

describe('type-composer-loader', () => {
  let context;
  let mockComposeWithMongoose;

  beforeEach(() => {
    mockComposeWithMongoose = jest.fn((model) => ({
      addFields: jest.fn(),
      setFields: jest.fn(),
      getFields: jest.fn(),
      getFieldNames: jest.fn(),
      getField: jest.fn(),
      removeField: jest.fn(),
      extendField: jest.fn(),
      setType: jest.fn(),
      getType: jest.fn(),
      getTypeName: jest.fn(),
      getTypeNonNull: jest.fn(),
      setTypeNonNull: jest.fn(),
      getInputType: jest.fn(),
      getOutputType: jest.fn(),
      getResolver: jest.fn(),
      setResolver: jest.fn(),
      hasResolver: jest.fn(),
      removeResolver: jest.fn(),
      getResolvers: jest.fn(),
      setResolvers: jest.fn(),
      hasInterface: jest.fn(),
      addInterface: jest.fn(),
      removeInterface: jest.fn(),
      getInterfaces: jest.fn(),
      setInterfaces: jest.fn(),
      getFieldType: jest.fn(),
      getFieldConfig: jest.fn(),
      isFieldNonNull: jest.fn(),
      makeFieldNonNull: jest.fn(),
      makeFieldNullable: jest.fn(),
      getFieldTC: jest.fn(),
      getFieldArgs: jest.fn(),
      getFieldArg: jest.fn(),
      hasFieldArg: jest.fn(),
      setFieldArgs: jest.fn(),
      addFieldArgs: jest.fn(),
      removeFieldArg: jest.fn(),
      removeFieldArgs: jest.fn(),
      isFieldDeprecated: jest.fn(),
      getFieldDeprecationReason: jest.fn(),
      setFieldDeprecate: jest.fn(),
      getFieldDirective: jest.fn(),
      getFieldDirectives: jest.fn(),
      setFieldDirective: jest.fn(),
      removeFieldDirective: jest.fn(),
      removeFieldDirectives: jest.fn(),
      getDirectives: jest.fn(),
      setDirectives: jest.fn(),
      getDirectiveNames: jest.fn(),
      getDirectiveByName: jest.fn(),
      getDirectiveById: jest.fn(),
    }));

    context = {
      models: {
        User: {
          schema: {
            tree: {
              name: { type: String, required: true },
              email: { type: String, required: true },
              age: { type: Number },
              createdAt: { type: Date },
              updatedAt: { type: Date },
            },
          },
        },
        Post: {
          schema: {
            tree: {
              title: { type: String, required: true },
              content: { type: String },
              author: { type: 'ObjectId', ref: 'User' },
              tags: [{ type: String }],
              publishedAt: { type: Date },
            },
          },
        },
      },
      schemaComposer: new SchemaComposer(),
      composeWithMongoose: mockComposeWithMongoose,
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
    };
  });

  describe('populateTypeComposers', () => {
    it('creates TypeComposers for all models (happy path)', async () => {
      const result = await populateTypeComposers(context);
      expect(result.typeComposers).toBeDefined();
      expect(result.typeComposers.UserTC).toBeDefined();
      expect(result.typeComposers.PostTC).toBeDefined();
      expect(mockComposeWithMongoose).toHaveBeenCalledTimes(2);
    });

    it('handles empty models object (edge case)', async () => {
      context.models = {};
      await expect(populateTypeComposers(context)).rejects.toThrow('No models provided');
    });

    it('handles missing context properties (failure path)', async () => {
      delete context.composeWithMongoose;
      await expect(populateTypeComposers(context)).rejects.toThrow();
    });

    it('skips existing TypeComposers', async () => {
      context.typeComposers = {
        UserTC: { /* mock TC */ },
      };
      const result = await populateTypeComposers(context);
      expect(result.typeComposers.UserTC).toBeDefined();
      expect(mockComposeWithMongoose).toHaveBeenCalledTimes(1); // Only for Post
    });
  });

  describe('typeComposerLoader', () => {
    it('loads and transforms TypeComposers (happy path)', async () => {
      const result = await typeComposerLoader(context);
      expect(result.typeComposers).toBeDefined();
      expect(result.schemaComposer).toBeDefined();
      expect(result.context).toBeDefined();
      expect(mockComposeWithMongoose).toHaveBeenCalledWith(
        context.models.User,
        expect.any(Object)
      );
      expect(mockComposeWithMongoose).toHaveBeenCalledWith(
        context.models.Post,
        expect.any(Object)
      );
    });

    it('handles missing models (failure path)', async () => {
      delete context.models;
      await expect(typeComposerLoader(context)).rejects.toThrow();
    });

    it('initializes context properties', async () => {
      delete context.typeComposers;
      delete context.schemaComposer;
      const result = await typeComposerLoader(context);
      expect(result.typeComposers).toBeDefined();
      expect(result.schemaComposer).toBeDefined();
    });

    it('processes plugins correctly', async () => {
      const mockPlugin = jest.fn();
      context.plugins = [mockPlugin];
      await typeComposerLoader(context);
      expect(mockPlugin).toHaveBeenCalled();
    });

    it('handles invalid plugins gracefully', async () => {
      context.plugins = ['not a function'];
      await typeComposerLoader(context);
      // Should not throw, just log warning
    });
  });

  describe('field type mapping', () => {
    it('maps basic Mongoose types to GraphQL types', async () => {
      const result = await typeComposerLoader(context);
      expect(result.typeComposers).toBeDefined();
      expect(mockComposeWithMongoose).toHaveBeenCalledWith(
        context.models.User,
        expect.any(Object)
      );
    });

    it('handles array types correctly', async () => {
      const result = await typeComposerLoader(context);
      expect(result.typeComposers).toBeDefined();
      expect(mockComposeWithMongoose).toHaveBeenCalledWith(
        context.models.Post,
        expect.any(Object)
      );
    });

    it('handles references correctly', async () => {
      const result = await typeComposerLoader(context);
      expect(result.typeComposers).toBeDefined();
      expect(mockComposeWithMongoose).toHaveBeenCalledWith(
        context.models.Post,
        expect.any(Object)
      );
    });
  });
}); 