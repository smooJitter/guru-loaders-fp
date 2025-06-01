import R from 'ramda';
import { createLoaderWithMiddleware } from '../utils/loader-utils.js';
import { pipeAsync } from '../utils/fp-utils.js';
import { loggingHook } from '../hooks/loggingHook';
import { validationHook } from '../hooks/validationHook';
import { errorHandlingHook } from '../hooks/errorHandlingHook';
import { contextInjectionHook } from '../hooks/contextInjectionHook';

// File patterns for actions
const ACTION_PATTERNS = {
  default: '**/*-actions.js',
  index: '**/actions/**/index.js'
};

// Action validation schema
const actionSchema = {
  name: ['string', 'undefined'],
  methods: ['object', 'undefined'],
  meta: ['object', 'undefined'],
  options: ['object', 'undefined']
};

// Action validation
const validateAction = (module) => {
  // Accept if methods is an object, or if there are function properties (excluding name/meta/options)
  if (module.methods && typeof module.methods === 'object') return true;
  // Check for direct function exports (excluding name/meta/options)
  const fnKeys = Object.keys(module).filter(
    (k) => !['name', 'meta', 'options', 'methods'].includes(k) && typeof module[k] === 'function'
  );
  return fnKeys.length > 0;
};

// Action transformation
const transformAction = (module) => {
  const { name, meta = {}, options = {} } = module;
  let methods;
  if (module.methods && typeof module.methods === 'object') {
    methods = module.methods;
  } else {
    // Use all function properties except name/meta/options/methods
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
    type: 'actions',
    timestamp: Date.now()
  };
};

// Middleware example
const logMiddleware = async (context) => {
  console.log('Loading actions with context:', context);
  return context;
};

// Create action loader with utilities
export const createActionLoader = (context, actions, options = {}) => {
  const loader = createLoaderWithMiddleware('actions', [
    // Use logging hook as middleware
    (ctx) => loggingHook(ctx, 'Loading actions')
  ], {
    ...options,
    patterns: ACTION_PATTERNS,
    validate: (module) => {
      // Use validation hook
      return validationHook(module, actionSchema) && validateAction(module);
    },
    transform: (module) => {
      // Use context injection hook
      const transformed = contextInjectionHook(transformAction(module), { context, actions });
      // Inject context and actions into each method
      transformed.methods = R.map(
        (method) => (args) => method({ ...args, context, actions }),
        transformed.methods
      );
      return transformed;
    }
  });

  return async (ctx) => {
    // Use error handling hook
    return errorHandlingHook(async () => {
      const { context: loaderContext, cleanup } = await loader(ctx);

      return {
        context: loaderContext,
        cleanup
      };
    }, ctx);
  };
}; 