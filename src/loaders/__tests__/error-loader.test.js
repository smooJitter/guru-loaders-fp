import { createErrorLoader } from '../error-loader.js';
import { jest } from '@jest/globals';

describe('Error Loader', () => {
  let errorLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    errorLoader = createErrorLoader();
  });

  test('should validate error module correctly', () => {
    const validModule = {
      name: 'appError',
      errors: { NotFound: { message: 'Resource not found' } },
    };
    expect(errorLoader.validate(validModule)).toBe(true);
  });

  test('should transform error module correctly', () => {
    const module = {
      name: 'appError',
      errors: { NotFound: { message: 'Resource not found' } },
    };
    const transformed = errorLoader.transform(module);
    expect(transformed.name).toBe('appError');
    expect(transformed.errors.NotFound.message).toBe('Resource not found');
  });

  test('should create error instance correctly', async () => {
    const module = {
      name: 'appError',
      errors: { NotFound: { message: 'Resource not found' } },
    };
    const instance = await errorLoader.create(mockContext);
    expect(instance.errors).toBeDefined();
  });
}); 