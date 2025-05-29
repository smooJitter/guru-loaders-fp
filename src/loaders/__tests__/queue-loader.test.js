import { createQueueLoader } from '../queue-loader.js';
import { jest } from '@jest/globals';

describe('Queue Loader', () => {
  let queueLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    queueLoader = createQueueLoader();
  });

  test('should validate queue module correctly', () => {
    const validModule = {
      name: 'appQueue',
      queues: { default: { concurrency: 5 } },
    };
    expect(queueLoader.validate(validModule)).toBe(true);
  });

  test('should transform queue module correctly', () => {
    const module = {
      name: 'appQueue',
      queues: { default: { concurrency: 5 } },
    };
    const transformed = queueLoader.transform(module);
    expect(transformed.name).toBe('appQueue');
    expect(transformed.queues.default.concurrency).toBe(5);
  });

  test('should create queue instance correctly', async () => {
    const module = {
      name: 'appQueue',
      queues: { default: { concurrency: 5 } },
    };
    const instance = await queueLoader.create(mockContext);
    expect(instance.add).toBeDefined();
    expect(instance.process).toBeDefined();
  });
}); 