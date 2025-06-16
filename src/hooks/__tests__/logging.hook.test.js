import { describe, it, expect, jest } from '@jest/globals';
import { loggingHook, logStart, logEnd } from '../logging.hook.js';

describe('loggingHook', () => {
  it('logs the message using context.logger.info', () => {
    const logger = { info: jest.fn() };
    const context = { logger };
    const message = 'Hello, world!';
    const result = loggingHook(context, message);
    expect(logger.info).toHaveBeenCalledWith(message);
    expect(result).toBe(context);
  });
});

describe('loggingHook fallback', () => {
  it('falls back to console.info if no logger', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const context = {};
    const message = 'Fallback!';
    loggingHook(context, message);
    expect(spy).toHaveBeenCalledWith(message);
    spy.mockRestore();
  });
});

describe('logStart and logEnd', () => {
  it('logs start with context.logger.info', () => {
    const logger = { info: jest.fn() };
    const context = { logger };
    logStart('step', context);
    expect(logger.info).toHaveBeenCalledWith('[START] step');
  });
  it('logs end with context.logger.info', () => {
    const logger = { info: jest.fn() };
    const context = { logger };
    logEnd('step', context);
    expect(logger.info).toHaveBeenCalledWith('[END] step');
  });
}); 