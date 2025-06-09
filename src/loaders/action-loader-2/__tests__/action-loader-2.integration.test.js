import { createActionLoader2 } from '../index.js';
import { withNamespace } from '../../../utils/withNamespace.js';
import { extractActions } from '../extractActions.js';

describe('action-loader-2 integration (file loading simulation)', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
  const context = { services: { logger: mockLogger } };

  // Simulate file discovery
  const mockFiles = [
    'modules/post.actions.js',
    'modules/admin.actions.js',
    'modules/legacy.actions.js'
  ];

  // Simulate file content for each file
  const fileModules = {
    'modules/post.actions.js': {
      default: withNamespace('post', {
        create: async () => 'created',
        delete: async () => 'deleted'
      })
    },
    'modules/admin.actions.js': {
      default: () => withNamespace('admin', {
        impersonate: async () => 'impersonated'
      })
    },
    'modules/legacy.actions.js': {
      default: {
        post: {
          create: {
            method: async () => 'legacy',
            meta: { legacy: true }
          }
        }
      }
    }
  };

  const findFiles = jest.fn(() => mockFiles);
  const importModule = jest.fn(async (file) => fileModules[file]);
  // Maximally defensive middleware-style no-op validation hook
  const noopValidationHook = (next) =>
    typeof next === 'function'
      ? async (...args) => await next(...args)
      : async () => next;
  // No-op validateExports to bypass legacy export checks
  const noopValidateExports = async () => true;

  it('loads and namespaces actions from discovered files', async () => {
    const loader = createActionLoader2({ findFiles, importModule, validationHook: noopValidationHook, validateExports: noopValidateExports });
    const { context: loadedContext } = await loader({ ...context, actions: {} });
    expect(loadedContext.actions.post.create).toBeInstanceOf(Function);
    expect(loadedContext.actions.admin.impersonate).toBeInstanceOf(Function);
    expect(loadedContext.actions.post.create.meta).toEqual({ legacy: true }); // legacy meta
    await expect(loadedContext.actions.post.create()).resolves.toBe('legacy'); // legacy wins
    await expect(loadedContext.actions.post.delete()).resolves.toBe('deleted');
    await expect(loadedContext.actions.admin.impersonate()).resolves.toBe('impersonated');
  });

  it('warns on duplicate actions across files', async () => {
    // Add a duplicate create in another file
    fileModules['modules/dupe.actions.js'] = {
      default: withNamespace('post', {
        create: async () => 'dupe'
      })
    };
    mockFiles.push('modules/dupe.actions.js');
    const loader = createActionLoader2({ findFiles, importModule, validationHook: noopValidationHook, validateExports: noopValidateExports });
    await loader({ ...context, actions: {} });
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate action: post.create'));
  });
}); 