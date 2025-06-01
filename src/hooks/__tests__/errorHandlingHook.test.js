import { errorHandlingHook } from '../errorHandlingHook';

describe('errorHandlingHook', () => {
  it('should execute the function and return its result', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const context = { logger: { error: jest.fn() } };

    const result = await errorHandlingHook(mockFn, context);

    expect(result).toBe('success');
    expect(context.logger.error).not.toHaveBeenCalled();
  });

  it('should log an error if the function throws', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('failure'));
    const context = { logger: { error: jest.fn() } };

    await expect(errorHandlingHook(mockFn, context)).rejects.toThrow('failure');
    expect(context.logger.error).toHaveBeenCalledWith('Error occurred:', expect.any(Error));
  });
}); 