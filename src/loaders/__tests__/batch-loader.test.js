import { createBatchLoader } from '../batch-loader.js';
import { jest } from '@jest/globals';

describe('Batch Loader', () => {
  let batchLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    batchLoader = createBatchLoader();
  });

  test('should validate batch module correctly', () => {
    const validModule = {
      name: 'appBatch',
      batches: { import: { size: 100 } },
    };
    expect(batchLoader.validate(validModule)).toBe(true);
  });

  test('should transform batch module correctly', () => {
    const module = {
      name: 'appBatch',
      batches: { import: { size: 100 } },
    };
    const transformed = batchLoader.transform(module);
    expect(transformed.name).toBe('appBatch');
    expect(transformed.batches.import.size).toBe(100);
  });

  test('should create batch instance correctly', async () => {
    const module = {
      name: 'appBatch',
      batches: { import: { size: 100 } },
    };
    const instance = await batchLoader.create(mockContext);
    expect(instance.process).toBeDefined();
    expect(instance.add).toBeDefined();
  });
}); 