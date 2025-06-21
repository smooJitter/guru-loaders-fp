import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { buildFlatRegistryByName } from '../core/loader-core/lib/registry-builders.js';

const AUTH_PATTERNS = [
  '**/auth.*.js',
  '**/roles.*.js',
  '**/guards.*.js',
  '**/auth/index.js'
];

const transform = (mod, context) =>
  typeof mod === 'function' ? mod(context) : mod;

// Context-agnostic validate: no logging, just check for name
const validate = (mod) => {
  let obj = typeof mod === 'function' ? mod({}) : mod;
  return !!obj && typeof obj.name === 'string';
};

export const createAuthLoader = (options = {}) =>
  createAsyncLoader('auth', {
    patterns: options.patterns || AUTH_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll,
    validate,
    registryBuilder: buildFlatRegistryByName,
    transform: (mod, context) => [transform(mod, context)],
    contextKey: 'auth',
    ...options
  });

export const authLoader = async (ctx = {}) => {
  const loader = createAuthLoader({ logger: ctx?.services?.logger || console });
  const result = await loader(ctx);
  return { auth: result.auth };
};

export default authLoader; 