import { loggingHook, validationHook as defaultValidationHook, errorHandlingHook, contextInjectionHook } from '../../hooks/index.js';
import { createLoaderWithMiddleware, buildRegistry } from '../../utils/loader-utils.js';
import { extractActions } from './extractActions.js';
import { validateActionModule } from './validateActionModule.js';

// Factory to create a configurable action loader
export const createActionLoader2 = (options = {}) => {
  const {
    patterns = ['**/*.actions.js'],
    findFiles,
    importModule,
    validationHook,
    transform = extractActions,
    ...rest
  } = options;

  // Production-ready loader supporting both legacy and modern registry patterns
  return async (context) => {
    // 1. Discover and import modules
    const files = findFiles ? await findFiles(patterns) : [];
    const modules = importModule ? await Promise.all(files.map(f => importModule(f))) : [];

    // 2. Transform modules (extract actions)
    const registry = transform ? transform(modules, context) : modules;

    // 3. Detect if registry is a modern action registry (object of namespaces)
    const isModernRegistry =
      registry &&
      typeof registry === 'object' &&
      Object.values(registry).every(
        ns =>
          typeof ns === 'object' &&
          Object.values(ns).every(fn => typeof fn === 'function' || (typeof fn === 'object' && typeof fn.method === 'function'))
      );

    // 4. Assign to context
    context.actions = isModernRegistry ? registry : buildRegistry(modules, context, transform);

    return { context, cleanup: () => {} };
  };
};

export default createActionLoader2(); 