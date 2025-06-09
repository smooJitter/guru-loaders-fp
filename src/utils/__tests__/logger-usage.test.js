import { describe, it, expect } from '@jest/globals';
import logger from '../logger.js';

describe('logger usage in a module', () => {
  it('should log messages in a user function', () => {
    function doSomething() {
      logger.info('Doing something');
      logger.warn('Something might be wrong');
      logger.error('Something went wrong');
    }
    expect(() => doSomething()).not.toThrow();
  });
}); 