import { createHandlerLoader } from '../index.js';
import { withNamespace } from '../../../utils/withNamespace.js';
import { extractHandlers } from '../extractHandlers.js';

describe('handler-loader integration (file loading simulation)', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() };
  const context = { services: { logger: mockLogger } };

  // Simulate file discovery
  const mockFiles = [
    'modules/post.handlers.js',
    'modules/admin.handlers.js',
    'modules/legacy.handlers.js'
  ];

  // Simulate file content for each file
  const fileModules = {
    'modules/post.handlers.js': {
      default: withNamespace('post', {
        create: async () => 'created',
        delete: async () => 'deleted'
      })
    },
    'modules/admin.handlers.js': {
      default: () => withNamespace('admin', {
        impersonate: async () => 'impersonated'
      })
    },
    'modules/legacy.handlers.js': {
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

  it('loads and namespaces handlers from discovered files', async () => {
    const loader = createHandlerLoader({ findFiles, importModule, validationHook: noopValidationHook, validateExports: noopValidateExports });
    const { context: loadedContext } = await loader({ ...context, handlers: {} });
    expect(loadedContext.handlers.post.create).toBeInstanceOf(Function);
    expect(loadedContext.handlers.admin.impersonate).toBeInstanceOf(Function);
    expect(loadedContext.handlers.post.create.meta).toEqual({ legacy: true }); // legacy meta
    await expect(loadedContext.handlers.post.create()).resolves.toBe('legacy'); // legacy wins
    await expect(loadedContext.handlers.post.delete()).resolves.toBe('deleted');
    await expect(loadedContext.handlers.admin.impersonate()).resolves.toBe('impersonated');
  });

  it('warns on duplicate handlers across files', async () => {
    // Add a duplicate create in another file
    fileModules['modules/dupe.handlers.js'] = {
      default: withNamespace('post', {
        create: async () => 'dupe'
      })
    };
    mockFiles.push('modules/dupe.handlers.js');
    const loader = createHandlerLoader({ findFiles, importModule, validationHook: noopValidationHook, validateExports: noopValidateExports });
    await loader({ ...context, handlers: {} });
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate handler: post.create'));
  });
}); 