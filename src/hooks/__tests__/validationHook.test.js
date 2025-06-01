import { validationHook } from '../validationHook';

describe('validationHook', () => {
  it('should validate the module against the schema', () => {
    const module = { name: 'test', methods: {} };
    const schema = { name: 'string', methods: 'object' };

    expect(() => validationHook(module, schema)).not.toThrow();
  });

  it('should throw an error if validation fails', () => {
    const module = { name: 'test', methods: 'not an object' };
    const schema = { name: 'string', methods: 'object' };

    expect(() => validationHook(module, schema)).toThrow('Module validation failed');
  });
}); 