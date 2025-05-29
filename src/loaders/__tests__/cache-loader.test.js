import { createCacheLoader } from '../cache-loader.js';
import { jest } from '@jest/globals';

describe('Cache Loader', () => {
  let cacheLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    cacheLoader = createCacheLoader();
  });

  test('should validate cache module correctly', () => {
    const validModule = {
      name: 'appCache',
      ttl: 3600,
      maxSize: 1000,
    };
    expect(cacheLoader.validate(validModule)).toBe(true);
  });

  test('should transform cache module correctly', () => {
    const module = {
      name: 'appCache',
      ttl: 3600,
      maxSize: 1000,
    };
    const transformed = cacheLoader.transform(module);
    expect(transformed.name).toBe('appCache');
    expect(transformed.ttl).toBe(3600);
    expect(transformed.maxSize).toBe(1000);
  });

  test('should create cache instance correctly', async () => {
    const module = {
      name: 'appCache',
      ttl: 3600,
      maxSize: 1000,
    };
    const instance = await cacheLoader.create(mockContext);
    expect(instance.get).toBeDefined();
    expect(instance.set).toBeDefined();
  });
}); 