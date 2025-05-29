import { createStorageLoader } from '../storage-loader.js';
import { jest } from '@jest/globals';

describe('Storage Loader', () => {
  let storageLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    storageLoader = createStorageLoader();
  });

  test('should validate storage module correctly', () => {
    const validModule = {
      name: 'appStorage',
      buckets: { public: { acl: 'public-read' } },
    };
    expect(storageLoader.validate(validModule)).toBe(true);
  });

  test('should transform storage module correctly', () => {
    const module = {
      name: 'appStorage',
      buckets: { public: { acl: 'public-read' } },
    };
    const transformed = storageLoader.transform(module);
    expect(transformed.name).toBe('appStorage');
    expect(transformed.buckets.public.acl).toBe('public-read');
  });

  test('should create storage instance correctly', async () => {
    const module = {
      name: 'appStorage',
      buckets: { public: { acl: 'public-read' } },
    };
    const instance = await storageLoader.create(mockContext);
    expect(instance.upload).toBeDefined();
    expect(instance.download).toBeDefined();
  });
}); 