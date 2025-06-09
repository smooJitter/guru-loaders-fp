import { describe, it, expect, jest } from '@jest/globals';
import { loggingHook } from '../logging.hook.js';

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