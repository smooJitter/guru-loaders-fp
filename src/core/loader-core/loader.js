// loader.js — loader-core
/**
 * Sync loader pipeline: discovery → import/context → validation → registry build → assignment
 *
 * All steps are synchronous and pure. No transforms or context in registryBuilder.
 *
 * Usage Example:
 *
 * import { createLoader } from './loader.js';
 * import { findFilesSync, importAndApplyAllSync } from '../../utils/file-utils-new.js';
 * import { buildFlatRegistryByName } from './lib/registry-builders.js';
 *
 * const loader = createLoader('actions', {
 *   patterns: ['src/actions/*.js'],
 *   findFiles: findFilesSync,
 *   importAndApplyAll: importAndApplyAllSync,
 *   registryBuilder: buildFlatRegistryByName,
 *   validate: mod => typeof mod.name === 'string',
 *   contextKey: 'actions',
 * });
 *
 * const context = loader({ services: myServices });
 * console.log(context.actions); // { actionName: actionModule, ... }
 */
export function createLoader(name, options = {}) {
  const {
    patterns = [],
    findFiles,
    importAndApplyAll,
    validate = () => true,
    registryBuilder,
    contextKey = name,
    ...rest
  } = options;

  return function loader(context = {}) {
    // 1. Discovery
    const files = findFiles ? findFiles(patterns, { ...rest, context }) : [];
    // 2. Import/context (context is only used here)
    const modules = importAndApplyAll ? importAndApplyAll(files, context) : [];
    // 3. Validation
    const validModules = (modules || []).filter(validate);
    // 4. Registry build
    const registry = registryBuilder ? registryBuilder(validModules) : {};
    // 5. Assignment
    return {
      ...context,
      [contextKey]: registry,
    };
  };
}
