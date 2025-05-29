import { createDataLoader } from '../data-loader.js';
import { jest } from '@jest/globals';

describe('Data Loader', () => {
  let dataLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        cache: new Map(),
        logger: {
          error: jest.fn(),
        },
      },
    };
    dataLoader = createDataLoader();
  });

  test('should validate data module correctly', () => {
    const validModule = {
      name: 'userLoader',
      model: 'User',
      batchFn: jest.fn(),
    };
    expect(dataLoader.validate(validModule)).toBe(true);
  });

  test('should transform data module correctly', () => {
    const module = {
      name: 'userLoader',
      model: 'User',
      batchFn: jest.fn(),
    };
    const transformed = dataLoader.transform(module);
    expect(transformed.name).toBe('userLoader');
    expect(transformed.model).toBe('User');
    expect(transformed.batchFn).toBeDefined();
  });

  test('should create data instance correctly', async () => {
    const module = {
      name: 'userLoader',
      model: 'User',
      batchFn: jest.fn(),
    };
    const instance = await dataLoader.create(mockContext);
    expect(instance.load).toBeDefined();
  });
}); 