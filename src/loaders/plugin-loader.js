import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for plugins
const PLUGIN_PATTERNS = {
  default: '**/plugins/**/*.plugin.js',
  hooks: '**/plugins/**/*.hooks.js',
  index: '**/plugins/index.js'
};

// Plugin validation schema
const pluginSchema = {
  name: String,
  version: String,
  hooks: Object,
  options: Object
};

// Plugin validation
const validatePlugin = (module) => {
  const { name, version, hooks } = module;
  return name && 
         version && 
         hooks && 
         typeof hooks === 'object';
};

// Plugin transformation
const transformPlugin = (module) => {
  const { name, version, hooks, options = {} } = module;
  
  return {
    name,
    version,
    hooks,
    options,
    type: 'plugin',
    timestamp: Date.now(),
    // Create Plugin instance
    create: (context) => {
      const { logger } = context.services;
      
      // Register hooks
      const registeredHooks = {};
      Object.entries(hooks).forEach(([hookName, hookFn]) => {
        if (typeof hookFn === 'function') {
          registeredHooks[hookName] = async (...args) => {
            try {
              return await hookFn(...args, context);
            } catch (error) {
              logger.error(`Error in ${name} hook ${hookName}:`, error);
              throw error;
            }
          };
        }
      });

      return {
        // Hook access
        hooks: registeredHooks,
        // Lifecycle methods
        onInit: async () => {
          if (registeredHooks.onInit) {
            await registeredHooks.onInit(context);
          }
        },
        onStart: async () => {
          if (registeredHooks.onStart) {
            await registeredHooks.onStart(context);
          }
        },
        onStop: async () => {
          if (registeredHooks.onStop) {
            await registeredHooks.onStop(context);
          }
        },
        // Request lifecycle hooks
        onRequest: async (req) => {
          if (registeredHooks.onRequest) {
            await registeredHooks.onRequest(req, context);
          }
        },
        onResponse: async (res) => {
          if (registeredHooks.onResponse) {
            await registeredHooks.onResponse(res, context);
          }
        },
        onError: async (error) => {
          if (registeredHooks.onError) {
            await registeredHooks.onError(error, context);
          }
        },
        // GraphQL specific hooks
        onSchema: async (schema) => {
          if (registeredHooks.onSchema) {
            await registeredHooks.onSchema(schema, context);
          }
        },
        onResolve: async (info) => {
          if (registeredHooks.onResolve) {
            await registeredHooks.onResolve(info, context);
          }
        },
        // Database hooks
        onConnect: async () => {
          if (registeredHooks.onConnect) {
            await registeredHooks.onConnect(context);
          }
        },
        onDisconnect: async () => {
          if (registeredHooks.onDisconnect) {
            await registeredHooks.onDisconnect(context);
          }
        },
        // Custom hook execution
        executeHook: async (hookName, ...args) => {
          if (registeredHooks[hookName]) {
            return await registeredHooks[hookName](...args, context);
          }
          return null;
        }
      };
    }
  };
};

// Create plugin loader
export const createPluginLoader = (options = {}) => {
  const loader = createLoader('plugin', {
    ...options,
    patterns: PLUGIN_PATTERNS,
    validate: validatePlugin,
    transform: transformPlugin
  });

  return loader;
}; 