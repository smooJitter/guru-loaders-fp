import { createAsyncLoader } from '../../core/loader-core/loader-async.js';
import { buildNamespacedRegistry } from '../../core/loader-core/lib/registry-builders.js';

const ACTION_PATTERNS = [
  '**/*.actions.js',
  '**/*-actions/index.js'
];

function validateAction(mod, file, logger) {
  const errors = [];
  const arr = Array.isArray(mod) ? mod : [mod];
  for (const action of arr) {
    if (!action) {
      errors.push(`Action is undefined or null in file: ${file}`);
      continue;
    }
    if (typeof action.namespace !== 'string') {
      errors.push(`Missing or invalid 'namespace' for action '${action.name ?? '[unknown]'}' in file: ${file}`);
    }
    if (typeof action.name !== 'string') {
      errors.push(`Missing or invalid 'name' for action in namespace '${action.namespace ?? '[unknown]'}' in file: ${file}`);
    }
    if (typeof action.method !== 'function') {
      errors.push(`Missing or invalid 'method' for action '${action.name ?? '[unknown]'}' in namespace '${action.namespace ?? '[unknown]'}' in file: ${file}`);
    }
  }
  if (errors.length && logger) {
    errors.forEach(err => logger.error?.(`[action-loader] ${err}`));
  }
  return errors.length === 0;
}

export const createActionLoader = (options = {}) => {
  return createAsyncLoader('actions', {
    patterns: options.patterns || ACTION_PATTERNS,
    findFiles: options.findFiles, // allow override for tests
    importAndApplyAll: options.importAndApplyAll, // allow override for tests
    validate: (mod, file, context) => {
      // Prefer context.services.logger, fallback to options.logger or console
      const logger = context?.services?.logger || options.logger || console;
      return validateAction(mod, file, logger);
    },
    registryBuilder: buildNamespacedRegistry,
    transform: mod => (Array.isArray(mod) ? mod : [mod]),
    contextKey: 'actions',
    ...options
  });
};

export const actionLoader = async (ctx = {}) => {
  const logger = ctx?.services?.logger || ctx?.options?.logger || console;
  const loader = createActionLoader({ logger });
  const result = await loader(ctx);
  return { actions: result.actions };
};

export default actionLoader; 