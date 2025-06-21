import { createAsyncLoader, composeTransforms } from '../core/loader-core';

const SERVICE_PATTERNS = [
  '**/*.service.js',
  '**/services/**/*.index.js'
];

// Normalizer for service modules (factory pattern)
export const normalizeServiceMod = async (mod, ctx) => {
  // Workaround: use ctx.options.transformContext if ctx is not an object
  let realCtx = ctx;
  if (typeof ctx !== 'object' || ctx === null) {
    realCtx = (ctx && ctx.options && ctx.options.transformContext) || {};
  }
  let svc = mod;
  if (svc && typeof svc.default !== 'undefined') svc = svc.default;
  if (typeof svc === 'function') svc = await svc(realCtx);
  if (!svc || typeof svc !== 'object') return undefined;
  const result = { ...svc, type: 'service' };
  console.log('DEBUG normalizeServiceMod:', { mod, ctx: realCtx, result });
  return result;
};

// Minimal validation: must have name and service
export const validateServiceModule = (type, mod) => {
  return !!(mod && typeof mod.name === 'string' && typeof mod.service === 'object');
};

const serviceLoaderCore = createAsyncLoader('services', {
  patterns: SERVICE_PATTERNS,
  transform: composeTransforms([normalizeServiceMod]),
  validate: validateServiceModule,
  registryType: 'service',
});

const serviceLoader = async (ctx = {}) => {
  const { context } = await serviceLoaderCore(ctx);
  ctx.services = context['services'] || {};
  return ctx;
};

export default serviceLoader;
export { serviceLoader }; 