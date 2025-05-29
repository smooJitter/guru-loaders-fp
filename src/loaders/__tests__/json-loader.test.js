import { createJsonLoader } from '../json-loader.js';
import { jest } from '@jest/globals';

describe('JSON Loader', () => {
  let jsonLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    jsonLoader = createJsonLoader();
  });

  test('should validate json module correctly', () => {
    const validModule = {
      name: 'config',
      data: { key: 'value' },
    };
    expect(jsonLoader.validate(validModule)).toBe(true);
  });

  test('should transform json module correctly', () => {
    const module = {
      name: 'config',
      data: { key: 'value' },
    };
    const transformed = jsonLoader.transform(module);
    expect(transformed.name).toBe('config');
    expect(transformed.data).toEqual({ key: 'value' });
  });

  test('should create json instance correctly', async () => {
    const module = {
      name: 'config',
      data: { key: 'value' },
    };
    const instance = await jsonLoader.create(mockContext);
    expect(instance.data).toBeDefined();
  });
}); 