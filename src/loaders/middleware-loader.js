import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { findFiles, importAndApplyAll } from '../utils/file-utils-new.js';
import { buildMiddlewareRegistryWithWarning } from '../core/loader-core/lib/registry-builders.js';

// File patterns for middleware
const MIDDLEWARE_PATTERNS = ['**/*.middleware.js'];

// Middleware validation schema for the validation hook
const middlewareSchema = {
  name: 'string',
  middleware: 'function',
  options: ['object', 'undefined']
};

// Define validate before use
const validate = m => !!m && typeof m.name === 'string' && typeof m.middleware === 'function';

// Extract a middleware object from a module (factory or object)
const extractMiddleware = (module, context) => {
  if (!module || typeof module !== 'object') return undefined;
  if (typeof module.default === 'function') {
    return module.default(context);
  }
  return module.default || module;
};

export function createMiddlewareLoader(options = {}) {
  return createAsyncLoader('middleware', {
    patterns: MIDDLEWARE_PATTERNS,
    findFiles,
    importAndApplyAll,
    registryBuilder: buildMiddlewareRegistryWithWarning,
    validate,
    contextKey: 'middleware',
    ...options
  });
}

export default createMiddlewareLoader(); 