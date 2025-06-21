import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { findFiles, importAndApplyAll } from '../utils/file-utils-new.js';
import { buildRouteRegistryWithWarning } from '../core/loader-core/lib/registry-builders.js';

const ROUTE_PATTERNS = ['**/*.route.js', '**/routes/**/*.index.js'];

const validate = m =>
  !!m &&
  typeof m.name === 'string' &&
  typeof m.method === 'string' &&
  typeof m.path === 'string' &&
  typeof m.handler === 'function';

export function createRouteLoader(options = {}) {
  return createAsyncLoader('routes', {
    patterns: ROUTE_PATTERNS,
    findFiles,
    importAndApplyAll,
    registryBuilder: buildRouteRegistryWithWarning,
    validate,
    contextKey: 'routes',
    ...options
  });
}

export default createRouteLoader(); 