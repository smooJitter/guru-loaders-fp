// validation.js — loader-core
import { isPlainObject } from 'ramda-adjunct';
import { is, filter, all, has, type } from 'ramda';

/**
 * Check if value is a non-empty array.
 * @param {*} val
 * @returns {boolean}
 */
export const isNonEmptyArray = val => is(Array, val) && val.length > 0;

/**
 * Check if value is a plain object (ramda-adjunct).
 * @param {*} val
 * @returns {boolean}
 */
export { isPlainObject };

/**
 * Check if a module is a plain object with a string 'name' property.
 * @param {*} mod
 * @returns {boolean}
 */
export const isValidModule = mod => isPlainObject(mod) && typeof mod.name === 'string';

/**
 * Check if an object has all required keys.
 * @param {Array<string>} keys
 * @param {Object} obj
 * @returns {boolean}
 */
export const hasRequiredKeys = (keys, obj) => all(k => has(k, obj), keys);

/**
 * Validate modules by predicate. Returns only valid modules.
 * @param {Array} modules
 * @param {Function} predicate
 * @returns {Array}
 */
export const validateModules = (modules, predicate) => filter(predicate, modules || []);

/**
 * Validate modules and return { valid, invalid } arrays.
 * @param {Array} modules
 * @param {Function} predicate
 * @returns {{ valid: Array, invalid: Array }}
 */
export const validateModulesDetailed = (modules, predicate) => {
  const valid = [];
  const invalid = [];
  (modules || []).forEach(m => (predicate(m) ? valid : invalid).push(m));
  return { valid, invalid };
};

/**
 * Check if value is a function or async function.
 * @param {*} val
 * @returns {boolean}
 */
export const isFunctionOrAsyncFunction = val =>
  type(val) === 'Function' || type(val) === 'AsyncFunction';
