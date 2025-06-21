// loader-async.js — loader-core-new
/**
 * Async loader pipeline: discovery → import/context → validation → registry build → assignment
 *
 * Context is only used at import time (via importAndApplyAll).
 *
 * @param {string} name - Loader name (for context key)
 * @param {object} options - Loader options
 * @param {string[]} options.patterns - Glob patterns for file discovery
 * @param {function} options.findFiles - Async function to find files
 * @param {function} options.validate - Function to validate modules
 * @param {function} options.registryBuilder - Pure function to build registry
 * @param {string} options.contextKey - Key to assign registry to on context
 * @returns {function} Loader function: async (context) => context
 */
import { importAndApplyAll as defaultImportAndApplyAll } from '../../utils/file-utils-new.js';

export function createAsyncLoader(name, options = {}) {
  const {
    patterns = [],
    findFiles,
    importAndApplyAll = defaultImportAndApplyAll, // allow override for tests
    validate = () => true,
    registryBuilder,
    contextKey = name,
    ...rest
  } = options;

  return async function loader(context = {}) {
    // 1. Discovery
    const files = await (findFiles ? findFiles(patterns, { ...rest, context }) : []);
    // 2. Import/context (context is only used here)
    const modules = await importAndApplyAll(files, context);
    // Always normalize to array
    const modulesArr = Array.isArray(modules) ? modules : [modules];
    // 3. Validation
    const validModules = (modulesArr || []).filter(validate);
    // 4. Registry build (pass context as second arg)
    const registry = registryBuilder ? registryBuilder(validModules, context) : {};
    // 5. Assignment
    return {
      ...context,
      [contextKey]: registry,
    };
  };
}
