import R from 'ramda';
import { createLoaderWithMiddleware } from '../utils/loader-utils.js';
import { pipeAsync } from '../utils/fp-utils.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for methods
const METHOD_PATTERNS = {
  default: '**/*.methods.js',
  index: '**/methods/**/*.index.js'
};

// Method validation schema
const methodSchema = {
  name: ['string', 'undefined'],
  methods: ['object', 'undefined'],
  meta: ['object', 'undefined'],
  options: ['object', 'undefined']
};

// Method validation
const validateMethod = (module) => {
  if (module.methods && typeof module.methods === 'object') return true;
  const fnKeys = Object.keys(module).filter(
    (k) => !['name', 'meta', 'options', 'methods'].includes(k) && typeof module[k] === 'function'
  );
  return fnKeys.length > 0;
};

// Method transformation
const transformMethod = (module) => {
  const { name, meta = {}, options = {} } = module;
  let methods;
  if (module.methods && typeof module.methods === 'object') {
    methods = module.methods;
  } else {
    methods = R.pickBy(
      (v, k) => typeof v === 'function' && !['name', 'meta', 'options', 'methods'].includes(k),
      module
    );
  }
  return {
    name,
    methods,
    meta,
    options,
    type: 'methods',
    timestamp: Date.now()
  };
};

// Create method loader with utilities
export const createMethodLoader = (context, methods, options = {}) => {
  const loader = createLoaderWithMiddleware('methods', [
    (ctx) => loggingHook(ctx, 'Loading methods')
  ], {
    ...options,
    patterns: METHOD_PATTERNS,
    validate: (module) => {
      return validationHook(module, methodSchema) && validateMethod(module);
    },
    transform: (module) => {
      const transformed = contextInjectionHook(transformMethod(module), { context, methods });
      transformed.methods = R.map(
        (method) => (args) => method({ ...args, context, methods }),
        transformed.methods
      );
      return transformed;
    }
  });

  return async (ctx) => {
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(ctx);
      return {
        context: loaderContext,
        cleanup
      };
    }, ctx);
  };
}; 