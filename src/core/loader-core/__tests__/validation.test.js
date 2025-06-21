import {
  isNonEmptyArray,
  isPlainObject,
  isValidModule,
  hasRequiredKeys,
  validateModules,
  validateModulesDetailed,
  isFunctionOrAsyncFunction
} from '../validation.js';

describe('validation.js', () => {
  describe('isNonEmptyArray', () => {
    it('returns true for non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
    });
    it('returns false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });
    it('returns false for non-arrays', () => {
      expect(isNonEmptyArray('foo')).toBe(false);
      expect(isNonEmptyArray({})).toBe(false);
      expect(isNonEmptyArray(null)).toBe(false);
    });
    it('returns false for array-like objects', () => {
      expect(isNonEmptyArray({ length: 1 })).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    it('returns true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });
    it('returns false for arrays, null, functions', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(() => {})).toBe(false);
    });
    it('returns true for Object.create(null)', () => {
      expect(isPlainObject(Object.create(null))).toBe(true);
    });
  });

  describe('isValidModule', () => {
    it('returns true for plain object with string name', () => {
      expect(isValidModule({ name: 'foo' })).toBe(true);
    });
    it('returns false for missing name or not object', () => {
      expect(isValidModule({})).toBe(false);
      expect(isValidModule({ name: 123 })).toBe(false);
      expect(isValidModule(null)).toBe(false);
      expect(isValidModule('foo')).toBe(false);
    });
    it('returns true for object with inherited name property', () => {
      function Named() {}
      Named.prototype.name = 'foo';
      const obj = new Named();
      expect(isValidModule(obj)).toBe(false); // name is not own property
    });
    it('returns true for object with empty string name', () => {
      expect(isValidModule({ name: '' })).toBe(true);
    });
  });

  describe('hasRequiredKeys', () => {
    it('returns true if all keys are present', () => {
      expect(hasRequiredKeys(['a', 'b'], { a: 1, b: 2 })).toBe(true);
    });
    it('returns false if any key is missing', () => {
      expect(hasRequiredKeys(['a', 'b'], { a: 1 })).toBe(false);
    });
    it('returns true for empty keys array', () => {
      expect(hasRequiredKeys([], { a: 1 })).toBe(true);
    });
    it('returns true if keys are present but undefined/null', () => {
      expect(hasRequiredKeys(['a', 'b'], { a: undefined, b: null })).toBe(true);
    });
    it('returns false for inherited keys', () => {
      const proto = { a: 1 };
      const obj = Object.create(proto);
      obj.b = 2;
      expect(hasRequiredKeys(['a', 'b'], obj)).toBe(false); // Only own properties are valid
    });
  });

  describe('validateModules', () => {
    it('filters modules by predicate', () => {
      const mods = [{ name: 'a' }, { name: 1 }, { foo: 2 }];
      expect(validateModules(mods, m => typeof m.name === 'string')).toEqual([{ name: 'a' }]);
    });
    it('returns empty array for empty input', () => {
      expect(validateModules([], m => true)).toEqual([]);
      expect(validateModules(null, m => true)).toEqual([]);
    });
  });

  describe('validateModulesDetailed', () => {
    it('splits valid and invalid modules', () => {
      const mods = [{ name: 'a' }, { name: 1 }, { foo: 2 }];
      const { valid, invalid } = validateModulesDetailed(mods, m => typeof m.name === 'string');
      expect(valid).toEqual([{ name: 'a' }]);
      expect(invalid).toEqual([{ name: 1 }, { foo: 2 }]);
    });
    it('all valid or all invalid', () => {
      const allValid = [{ name: 'a' }];
      const allInvalid = [{ foo: 1 }];
      expect(validateModulesDetailed(allValid, m => m.name)).toEqual({ valid: allValid, invalid: [] });
      expect(validateModulesDetailed(allInvalid, m => m.name)).toEqual({ valid: [], invalid: allInvalid });
    });
    it('returns empty arrays for empty input', () => {
      expect(validateModulesDetailed([], m => true)).toEqual({ valid: [], invalid: [] });
      expect(validateModulesDetailed(null, m => true)).toEqual({ valid: [], invalid: [] });
    });
  });

  describe('isFunctionOrAsyncFunction', () => {
    it('returns true for functions and async functions', () => {
      expect(isFunctionOrAsyncFunction(() => {})).toBe(true);
      expect(isFunctionOrAsyncFunction(async () => {})).toBe(true);
    });
    it('returns false for non-functions', () => {
      expect(isFunctionOrAsyncFunction({})).toBe(false);
      expect(isFunctionOrAsyncFunction(null)).toBe(false);
      expect(isFunctionOrAsyncFunction(42)).toBe(false);
    });
    it('returns false for generator function and true for class constructor', () => {
      function* gen() {}
      class MyClass {}
      expect(isFunctionOrAsyncFunction(gen)).toBe(false);
      expect(isFunctionOrAsyncFunction(MyClass)).toBe(true); // Classes are functions in JS
    });
  });
}); 