import { describe, it, expect } from '@jest/globals';
import logger from '../logger.js';

describe('logger utility', () => {
  it('should be a function (Pino instance)', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.child).toBe('function');
  });

  it('should log info messages without throwing', () => {
    expect(() => logger.info('Test info log')).not.toThrow();
  });

  it('should log error messages without throwing', () => {
    expect(() => logger.error('Test error log')).not.toThrow();
  });

  it('should log warn messages without throwing', () => {
    expect(() => logger.warn('Test warn log')).not.toThrow();
  });

  it('child should return a logger instance', () => {
    const childLogger = logger.child({ module: 'test' });
    expect(typeof childLogger.info).toBe('function');
  });
}); 