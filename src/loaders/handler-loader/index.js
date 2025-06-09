import { loggingHook, validationHook as defaultValidationHook, errorHandlingHook, contextInjectionHook } from '../../hooks/index.js';
import { createLoaderWithMiddleware, buildRegistry } from '../../utils/loader-utils.js';
import { extractHandlers } from './extractHandlers.js';
import { validateHandlerModule } from './validateHandlerModule.js';

// Factory to create a configurable handler loader
export const createHandlerLoader = (options = {}) => {
  const {
    patterns = ['**/*.handlers.js'],
    findFiles,
    importModule,
    validationHook,
    transform = extractHandlers,
    ...rest
  } = options;

  // Production-ready loader supporting both legacy and modern registry patterns
  return async (context) => {
    // 1. Discover and import modules
    const files = findFiles ? await findFiles(patterns) : [];
    const modules = importModule ? await Promise.all(files.map(f => importModule(f))) : [];

    // 2. Transform modules (extract handlers)
    const registry = transform ? transform(modules, context) : modules;

    // 3. Detect if registry is a modern handler registry (object of namespaces)
    const isModernRegistry =
      registry &&
      typeof registry === 'object' &&
      Object.values(registry).every(
        ns =>
          typeof ns === 'object' &&
          Object.values(ns).every(fn => typeof fn === 'function' || (typeof fn === 'object' && typeof fn.method === 'function'))
      );

    // 4. Assign to context
    context.handlers = isModernRegistry ? registry : buildRegistry(modules, context, transform);

    return { context, cleanup: () => {} };
  };
};

export default createHandlerLoader(); 