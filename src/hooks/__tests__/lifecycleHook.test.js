import { lifecycleHook } from '../lifecycleHook';

describe('lifecycleHook', () => {
  it('should execute all lifecycle methods', async () => {
    const mockMethod1 = jest.fn();
    const mockMethod2 = jest.fn();
    const context = {};

    await lifecycleHook([mockMethod1, mockMethod2], context);

    expect(mockMethod1).toHaveBeenCalledWith(context);
    expect(mockMethod2).toHaveBeenCalledWith(context);
  });

  it('should handle non-function methods gracefully', async () => {
    const mockMethod = jest.fn();
    const context = {};

    await lifecycleHook([mockMethod, null, undefined], context);

    expect(mockMethod).toHaveBeenCalledWith(context);
  });
}); 