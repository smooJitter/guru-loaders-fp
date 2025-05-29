import { createMiddlewareLoader } from '../middleware-loader.js';
import { jest } from '@jest/globals';

describe('Middleware Loader', () => {
  let middlewareLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    middlewareLoader = createMiddlewareLoader();
  });

  test('should validate middleware module correctly', () => {
    const validModule = {
      name: 'loggingMiddleware',
      middleware: jest.fn(),
    };
    expect(middlewareLoader.validate(validModule)).toBe(true);
  });

  test('should transform middleware module correctly', () => {
    const module = {
      name: 'loggingMiddleware',
      middleware: jest.fn(),
    };
    const transformed = middlewareLoader.transform(module);
    expect(transformed.name).toBe('loggingMiddleware');
    expect(transformed.middleware).toBeDefined();
  });

  test('should create middleware instance correctly', async () => {
    const module = {
      name: 'loggingMiddleware',
      middleware: jest.fn(),
    };
    const instance = await middlewareLoader.create(mockContext);
    expect(instance.middleware).toBeDefined();
  });
}); 