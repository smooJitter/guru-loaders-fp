import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { SchemaComposer } from 'graphql-compose';
import { createTypeComposerLoader } from '../../loaders/type-composer-loader/index.js';

// Mock logger
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

// Mock mongoose models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number },
  isActive: { type: Boolean },
  createdAt: { type: Date },
  metadata: { type: Object },
  tags: [String],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: { type: Number, default: 0 },
  tags: [String]
});

// Base context setup
const baseContext = () => ({
  models: {},
  typeComposers: {},
  schemaComposer: new SchemaComposer(),
  logger: mockLogger
});

describe('TypeComposer Loader', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Clean up mongoose models
    Object.keys(mongoose.models).forEach(model => {
      try { mongoose.deleteModel(model); } catch {}
    });
  });

  describe('Happy Path', () => {
    it('creates TypeComposers for all models with correct field mappings', async () => {
      // Setup
      const User = mongoose.model('User', userSchema);
      const Post = mongoose.model('Post', postSchema);
      const context = baseContext();
      context.models = { User, Post };

      // Execute
      const loader = createTypeComposerLoader();
      const result = await loader(context);

      // Verify
      expect(result.typeComposers.User).toBeDefined();
      expect(result.typeComposers.Post).toBeDefined();

      // Check User TypeComposer fields
      const userTC = result.typeComposers.User;
      expect(userTC.getFieldType('name')).toBe('String!');
      expect(userTC.getFieldType('email')).toBe('String!');
      expect(userTC.getFieldType('age')).toBe('Float');
      expect(userTC.getFieldType('isActive')).toBe('Boolean');
      expect(userTC.getFieldType('createdAt')).toBe('Date');
      expect(userTC.getFieldType('metadata')).toBe('JSON');
      expect(userTC.getFieldType('tags')).toBe('[String]');
      expect(userTC.getFieldType('friends')).toBe('[ID]');

      // Check Post TypeComposer fields
      const postTC = result.typeComposers.Post;
      expect(postTC.getFieldType('title')).toBe('String!');
      expect(postTC.getFieldType('content')).toBe('String');
      expect(postTC.getFieldType('author')).toBe('ID');
      expect(postTC.getFieldType('likes')).toBe('Float');
      expect(postTC.getFieldType('tags')).toBe('[String]');
    });

    it('supports plugins that extend TypeComposers', async () => {
      // Setup
      const User = mongoose.model('User', userSchema);
      const context = baseContext();
      context.models = { User };
      
      const plugin = jest.fn(async ({ schemaComposer, typeComposers }) => {
        typeComposers.User.addFields({
          fullName: {
            type: 'String',
            resolve: source => `${source.firstName} ${source.lastName}`
          }
        });
      });

      // Execute
      const loader = createTypeComposerLoader();
      const result = await loader({ ...context, plugins: [plugin] });

      // Verify
      expect(plugin).toHaveBeenCalled();
      expect(result.typeComposers.User.hasField('fullName')).toBe(true);
      expect(result.typeComposers.User.getFieldType('fullName')).toBe('String');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty models object gracefully', async () => {
      const context = baseContext();
      context.models = {};
      const loader = createTypeComposerLoader();
      await expect(loader(context)).rejects.toThrow('No models provided');
    });

    it('skips invalid plugins but continues processing', async () => {
      // Setup
      const User = mongoose.model('User', userSchema);
      const context = baseContext();
      context.models = { User };
      const validPlugin = jest.fn();
      const invalidPlugins = [null, undefined, 42, 'not a function'];

      // Execute
      const loader = createTypeComposerLoader();
      await loader({ ...context, plugins: [...invalidPlugins, validPlugin] });

      // Verify
      expect(validPlugin).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid plugin'));
    });

    it('warns on duplicate TypeComposer names', async () => {
      // Setup
      const User1 = mongoose.model('User', userSchema);
      const User2 = mongoose.model('User', new mongoose.Schema({ foo: String }));
      const context = baseContext();
      context.models = { User1, User2 };

      // Execute
      const loader = createTypeComposerLoader();
      await loader(context);

      // Verify
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate typeComposer name'));
    });
  });

  describe('Failure Paths', () => {
    it('throws on invalid context', async () => {
      const loader = createTypeComposerLoader();
      await expect(loader()).rejects.toThrow('Invalid context');
      await expect(loader(null)).rejects.toThrow('Invalid context');
      await expect(loader('not an object')).rejects.toThrow('Invalid context');
    });

    it('throws on plugin errors but preserves stack trace', async () => {
      // Setup
      const User = mongoose.model('User', userSchema);
      const context = baseContext();
      context.models = { User };
      const errorPlugin = jest.fn(() => {
        throw new Error('Plugin error');
      });

      // Execute & Verify
      const loader = createTypeComposerLoader();
      await expect(loader({ ...context, plugins: [errorPlugin] }))
        .rejects
        .toThrow('Plugin error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[type-composer-loader] Plugin error:',
        expect.any(Error)
      );
    });

    it('throws on invalid model validation', async () => {
      // Setup
      const context = baseContext();
      context.models = { 
        InvalidModel: { 
          // Not a real mongoose model
          schema: { fields: { foo: 'bar' } }
        }
      };

      // Execute & Verify
      const loader = createTypeComposerLoader();
      await expect(loader(context)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error creating typeComposer'),
        expect.any(Error)
      );
    });
  });
}); 