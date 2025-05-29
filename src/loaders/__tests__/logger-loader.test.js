import { createLoggerLoader } from '../logger-loader.js';
import { jest } from '@jest/globals';

describe('Logger Loader', () => {
  let loggerLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    loggerLoader = createLoggerLoader();
  });

  test('should validate logger module correctly', () => {
    const validModule = {
      name: 'appLogger',
      level: 'info',
      format: 'json',
    };
    expect(loggerLoader.validate(validModule)).toBe(true);
  });

  test('should transform logger module correctly', () => {
    const module = {
      name: 'appLogger',
      level: 'info',
      format: 'json',
    };
    const transformed = loggerLoader.transform(module);
    expect(transformed.name).toBe('appLogger');
    expect(transformed.level).toBe('info');
    expect(transformed.format).toBe('json');
  });

  test('should create logger instance correctly', async () => {
    const module = {
      name: 'appLogger',
      level: 'info',
      format: 'json',
    };
    const instance = await loggerLoader.create(mockContext);
    expect(instance.log).toBeDefined();
    expect(instance.error).toBeDefined();
  });
}); 