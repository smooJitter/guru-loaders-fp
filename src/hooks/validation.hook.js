/**
 * Validation Hook
 *
 * @function validationHook
 * @description Validates a module against a schema. Throws if validation fails. Intended for use in loader pipelines or modular steps.
 * @param {object} module - The module to validate.
 * @param {object} schema - The schema to validate against (key: property, value: expected type).
 * @returns {object} The validated module.
 */
export const validationHook = (module, schema) => {
  const failures = [];
  Object.entries(schema).forEach(([key, expected]) => {
    const actual = typeof module[key];
    const ok = Array.isArray(expected)
      ? expected.includes(actual)
      : actual === expected;
    if (!ok) failures.push({ key, expected, actual });
  });
  if (failures.length) {
    const msg = failures
      .map(f => `${f.key}: expected ${f.expected}, got ${f.actual}`)
      .join('; ');
    throw new TypeError(`Module validation failed — ${msg}`);
  }
  return module;
}; 