import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createActionLoader, actionLoader } from '../../loaders/action-loader/index.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

// Mock file discovery and import
const mockFindFiles = jest.fn();
const mockImportModule = jest.fn();

// Helper to create namespaced actions
const withNamespace = (namespace, methods) => 
  Object.entries(methods).map(([name, method]) => ({
    namespace,
    name,
    method,
    meta: { description: `${namespace}.${name}` }
  }));

// Base context setup
const baseContext = () => ({
  services: { logger: mockLogger },
  actions: {},
  config: {}
});

describe('action-loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFiles.mockReset();
    mockImportModule.mockReset();
  });

  describe('Happy Path', () => {
    it('loads actions from function factory', async () => {
      // Setup
      const userActions = ({ context }) => withNamespace('user', {
        create: async (input) => `Created user: ${input.name}`,
        delete: async (id) => `Deleted user: ${id}`
      });

      mockFindFiles.mockResolvedValue(['user.actions.js']);
      mockImportModule.mockResolvedValue({ default: userActions });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.user).toBeDefined();
      expect(typeof result.context.actions.user.create).toBe('function');
      expect(typeof result.context.actions.user.delete).toBe('function');

      // Test action execution
      const createResult = await result.context.actions.user.create({ name: 'Test' });
      expect(createResult).toBe('Created user: Test');
    });

    it('loads actions from array format', async () => {
      // Setup
      const postActions = [
        {
          namespace: 'post',
          name: 'create',
          method: async (input) => `Created post: ${input.title}`,
          meta: { description: 'Create a new post' }
        },
        {
          namespace: 'post',
          name: 'delete',
          method: async (id) => `Deleted post: ${id}`,
          meta: { description: 'Delete a post' }
        }
      ];

      mockFindFiles.mockResolvedValue(['post.actions.js']);
      mockImportModule.mockResolvedValue({ default: postActions });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.post).toBeDefined();
      expect(typeof result.context.actions.post.create).toBe('function');
      expect(result.context.actions.post.create.meta).toEqual({ description: 'Create a new post' });

      // Test action execution
      const createResult = await result.context.actions.post.create({ title: 'Test Post' });
      expect(createResult).toBe('Created post: Test Post');
    });

    it('loads actions from object format', async () => {
      // Setup
      const adminActions = {
        admin: {
          impersonate: async ({ userId }) => `Impersonating user: ${userId}`,
          ban: async ({ userId }) => `Banned user: ${userId}`
        }
      };

      mockFindFiles.mockResolvedValue(['admin.actions.js']);
      mockImportModule.mockResolvedValue({ default: adminActions });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.admin).toBeDefined();
      expect(typeof result.context.actions.admin.impersonate).toBe('function');
      expect(typeof result.context.actions.admin.ban).toBe('function');

      // Test action execution
      const impersonateResult = await result.context.actions.admin.impersonate({ userId: '123' });
      expect(impersonateResult).toBe('Impersonating user: 123');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file list', async () => {
      // Setup
      mockFindFiles.mockResolvedValue([]);
      
      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute & Verify
      const result = await loader(context);
      expect(result.context.actions).toEqual({});
      expect(mockImportModule).not.toHaveBeenCalled();
    });

    it('skips invalid modules but continues processing', async () => {
      // Setup
      const validAction = {
        namespace: 'valid',
        name: 'test',
        method: () => 'ok'
      };

      mockFindFiles.mockResolvedValue(['valid.actions.js', 'invalid.actions.js']);
      mockImportModule
        .mockResolvedValueOnce({ default: [validAction] })
        .mockResolvedValueOnce({ default: 'not a valid module' });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.valid).toBeDefined();
      expect(result.context.actions.valid.test).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('warns on duplicate action names', async () => {
      // Setup
      const actions = [
        { namespace: 'test', name: 'duplicate', method: () => 'first' },
        { namespace: 'test', name: 'duplicate', method: () => 'second' }
      ];

      mockFindFiles.mockResolvedValue(['test.actions.js']);
      mockImportModule.mockResolvedValue({ default: actions });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.test.duplicate).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate action: test.duplicate')
      );
    });

    it('preserves meta and options on actions', async () => {
      // Setup
      const actions = [{
        namespace: 'test',
        name: 'action',
        method: () => 'result',
        meta: { description: 'Test action' },
        options: { timeout: 1000 }
      }];

      mockFindFiles.mockResolvedValue(['test.actions.js']);
      mockImportModule.mockResolvedValue({ default: actions });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.test.action.meta).toEqual({ description: 'Test action' });
      expect(result.context.actions.test.action.options).toEqual({ timeout: 1000 });
    });
  });

  describe('Failure Paths', () => {
    it('handles file discovery errors', async () => {
      // Setup
      const error = new Error('File discovery failed');
      mockFindFiles.mockRejectedValue(error);

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        logger: mockLogger
      });

      // Execute & Verify
      const result = await loader(context);
      expect(result.context.actions).toEqual({});
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[actions-loader] Error finding files:',
        error
      );
    });

    it('handles module import errors', async () => {
      // Setup
      const error = new Error('Import failed');
      mockFindFiles.mockResolvedValue(['error.actions.js']);
      mockImportModule.mockRejectedValue(error);

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule,
        logger: mockLogger
      });

      // Execute & Verify
      const result = await loader(context);
      expect(result.context.actions).toEqual({});
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[actions-loader] Failed to import module error.actions.js:',
        error
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[actions-loader] Dropped invalid or failed module during preTransform.'
      );
    });

    it('handles invalid action definitions', async () => {
      // Setup - various invalid action formats
      const invalidActions = [
        { namespace: 'test1' }, // missing name and method
        { name: 'test2', method: () => {} }, // missing namespace
        { namespace: 'test3', name: 'test3' }, // missing method
        { namespace: 'test4', name: 'test4', method: 'not a function' } // invalid method
      ];

      mockFindFiles.mockResolvedValue(['invalid.actions.js']);
      mockImportModule.mockResolvedValue({ default: invalidActions });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions).toEqual({});
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('handles action execution errors', async () => {
      // Setup
      const errorAction = {
        namespace: 'test',
        name: 'error',
        method: async () => { throw new Error('Action failed'); }
      };

      mockFindFiles.mockResolvedValue(['error.actions.js']);
      mockImportModule.mockResolvedValue({ default: [errorAction] });

      const context = baseContext();
      const loader = createActionLoader({
        findFiles: mockFindFiles,
        importModule: mockImportModule
      });

      // Execute
      const result = await loader(context);

      // Verify
      expect(result.context.actions.test.error).toBeDefined();
      await expect(result.context.actions.test.error()).rejects.toThrow('Action failed');
    });
  });

  describe('Convenience API', () => {
    it('actionLoader provides a simplified interface', async () => {
      // Setup
      const actions = withNamespace('test', {
        action: () => 'result'
      });

      mockFindFiles.mockResolvedValue(['test.actions.js']);
      mockImportModule.mockResolvedValue({ default: actions });

      const context = {
        options: {
          findFiles: mockFindFiles,
          importModule: mockImportModule
        }
      };

      // Execute
      const result = await actionLoader(context);

      // Verify
      expect(result.actions).toBeDefined();
      expect(result.actions.test).toBeDefined();
      expect(typeof result.actions.test.action).toBe('function');
    });
  });
});