// LEGACY: This loader only supports the { name, methods } pattern. Use action-loader-2 for modern namespaced/array/factory patterns.
// For new code, prefer action-loader-2.
//

import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook } from '../../hooks/index.js';
import { createLoaderWithMiddleware } from '../../utils/loader-utils.js';
import { getActionsFromModule, validateActionModule } from '../../utils/action-loader-utils.js';

/**
 * File patterns for actions
 */
const ACTION_PATTERNS = {
  default: '**/*.actions.js',
  index: '**/actions/**/*.index.js'
};

/**
 * Action validation schema (for meta/options, not enforced strictly)
 */
const actionSchema = {
  name: ['string', 'undefined'],
  methods: ['object', 'undefined'],
  meta: ['object', 'undefined'],
  options: ['object', 'undefined']
};

/**
 * Transform an action function into the loader format, injecting context and actions.
 * @param {string} name - Action name
 * @param {function} fn - Action function
 * @param {object} context - Loader context
 * @param {object} actions - All actions
 * @returns {object}
 */
const transformAction = (name, fn, context, actions) => {
  return {
    name,
    method: (args) => fn({ ...args, context, actions }),
    type: 'actions',
    timestamp: Date.now()
  };
};

// Utility to flatten and aggregate actions from modules
const extractActions = (modules, context) => {
  const registry = {};
  const logger = context?.services?.logger;
  if (!Array.isArray(modules) || modules.length === 0) {
    // Defensive: always return an object
    return registry;
  }
  for (const mod of modules) {
    if (!mod || typeof mod !== 'object') {
      logger?.debug?.('[action-loader] Skipping non-object module:', mod);
      logger?.error?.('[action-loader] Invalid module (not an object):', mod);
      continue;
    }
    // Defensive: validate shape
    if (typeof mod.name !== 'string' || typeof mod.methods !== 'object' || mod.methods === null) {
      logger?.error?.('[action-loader] Invalid module shape (expected { name, methods }):', mod);
      continue;
    }
    if (registry[mod.name]) {
      logger?.warn?.(`[action-loader] Duplicate action name: ${mod.name}`);
    }
    // Only include function-valued methods
    const validMethods = Object.entries(mod.methods).filter(([, fn]) => typeof fn === 'function');
    if (validMethods.length === 0) {
      logger?.error?.('[action-loader] No valid action functions found in module:', mod);
    }
    // Register as { method: fn } for legacy compatibility
    registry[mod.name] = {
      method: validMethods.length > 0 ? ((args) => validMethods[0][1]({ ...args, context, actions: registry })) : undefined
    };
  }
  return registry;
};

// TODO: Expand tests for more edge cases and performance

const actionLoader = async (context, modules) => {
  // Defensive: always return an object for actions
  const registry = extractActions(modules, context);
  context.actions = registry;
  return { context };
};

export default actionLoader; 