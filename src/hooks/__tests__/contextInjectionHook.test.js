import { contextInjectionHook } from '../contextInjectionHook';

describe('contextInjectionHook', () => {
  it('should inject context into the module', () => {
    const module = { name: 'test' };
    const context = { logger: console };

    const result = contextInjectionHook(module, context);

    expect(result).toEqual({ ...module, context });
  });
}); 