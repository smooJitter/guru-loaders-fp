import { createAsyncLoader } from '../../core/loader-core/loader-async.js';
import { buildNamespacedRegistry } from '../../core/loader-core/lib/registry-builders.js';

const HANDLER_PATTERNS = [
  '**/*.handlers.js',
  '**/*-handlers/index.js'
];

function validateHandler(mod, file, logger) {
  const errors = [];
  const arr = Array.isArray(mod) ? mod : [mod];
  for (const handler of arr) {
    if (!handler) {
      errors.push(`Handler is undefined or null in file: ${file}`);
      continue;
    }
    if (typeof handler.namespace !== 'string') {
      errors.push(`Missing or invalid 'namespace' for handler '${handler.name ?? '[unknown]'}' in file: ${file}`);
    }
    if (typeof handler.name !== 'string') {
      errors.push(`Missing or invalid 'name' for handler in namespace '${handler.namespace ?? '[unknown]'}' in file: ${file}`);
    }
    if (typeof handler.method !== 'function') {
      errors.push(`Missing or invalid 'method' for handler '${handler.name ?? '[unknown]'}' in namespace '${handler.namespace ?? '[unknown]'}' in file: ${file}`);
    }
  }
  if (errors.length && logger) {
    errors.forEach(err => logger.error?.(`[handler-loader] ${err}`));
  }
  return errors.length === 0;
}

export const createHandlerLoader = (options = {}) => {
  return createAsyncLoader('handlers', {
    patterns: options.patterns || HANDLER_PATTERNS,
    findFiles: options.findFiles, // allow override for tests
    importAndApplyAll: options.importAndApplyAll, // allow override for tests
    validate: (mod, file, context) => {
      // Prefer context.services.logger, fallback to options.logger or console
      const logger = context?.services?.logger || options.logger || console;
      return validateHandler(mod, file, logger);
    },
    registryBuilder: buildNamespacedRegistry,
    transform: mod => (Array.isArray(mod) ? mod : [mod]),
    contextKey: 'handlers',
    ...options
  });
};

export const handlerLoader = async (ctx = {}) => {
  const logger = ctx?.services?.logger || ctx?.options?.logger || console;
  const loader = createHandlerLoader({ logger });
  const result = await loader(ctx);
  return { handlers: result.handlers };
};

export default handlerLoader; 