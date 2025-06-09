import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { errorHandlingHook, withErrorHandling } from '../errorHandling.hook.js';

describe('errorHandlingHook', () => {
  let fn, context, error;
  beforeEach(() => {
    error = new Error('fail');
    fn = jest.fn(async () => { throw error; });
  });

  it('returns result on success', async () => {
    const fn = jest.fn(async (x) => x * 2);
    const context = { logger: { error: jest.fn() } };
    const result = await errorHandlingHook(fn, context, 3);
    expect(result).toBe(6);
    expect(context.logger.error).not.toHaveBeenCalled();
  });

  it('logs error using context.services.logger.error', async () => {
    const logger = { error: jest.fn() };
    context = { services: { logger } };
    await expect(errorHandlingHook(fn, context)).rejects.toThrow('fail');
    expect(logger.error).toHaveBeenCalledWith('Error occurred:', error);
  });

  it('logs error using context.logger.error', async () => {
    const logger = { error: jest.fn() };
    context = { logger };
    await expect(errorHandlingHook(fn, context)).rejects.toThrow('fail');
    expect(logger.error).toHaveBeenCalledWith('Error occurred:', error);
  });

  it('logs error using console.error if no logger', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    context = {};
    await expect(errorHandlingHook(fn, context)).rejects.toThrow('fail');
    expect(spy).toHaveBeenCalledWith('Error occurred:', error);
    spy.mockRestore();
  });
});

describe('withErrorHandling', () => {
  it('calls onError and propagates error', async () => {
    const fn = jest.fn(async () => { throw new Error('fail'); });
    const onError = jest.fn(async () => {});
    const wrapped = withErrorHandling(fn, { onError });
    await expect(wrapped()).rejects.toThrow('fail');
    expect(onError).toHaveBeenCalled();
  });

  it('onError itself throws, logs to console', async () => {
    const fn = jest.fn(async () => { throw new Error('fail'); });
    const onError = jest.fn(async () => { throw new Error('onError fail'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const wrapped = withErrorHandling(fn, { onError });
    await expect(wrapped()).rejects.toThrow('fail');
    expect(onError).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('onError hook failed', expect.any(Error));
    spy.mockRestore();
  });

  it('no onError, just propagates error', async () => {
    const fn = jest.fn(async () => { throw new Error('fail'); });
    const wrapped = withErrorHandling(fn);
    await expect(wrapped()).rejects.toThrow('fail');
  });
}); 