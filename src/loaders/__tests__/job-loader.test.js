import { createJobLoader } from '../job-loader.js';
import { jest } from '@jest/globals';

describe('Job Loader', () => {
  let jobLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    jobLoader = createJobLoader();
  });

  test('should validate job module correctly', () => {
    const validModule = {
      name: 'appJob',
      jobs: { import: { concurrency: 5 } },
    };
    expect(jobLoader.validate(validModule)).toBe(true);
  });

  test('should transform job module correctly', () => {
    const module = {
      name: 'appJob',
      jobs: { import: { concurrency: 5 } },
    };
    const transformed = jobLoader.transform(module);
    expect(transformed.name).toBe('appJob');
    expect(transformed.jobs.import.concurrency).toBe(5);
  });

  test('should create job instance correctly', async () => {
    const module = {
      name: 'appJob',
      jobs: { import: { concurrency: 5 } },
    };
    const instance = await jobLoader.create(mockContext);
    expect(instance.process).toBeDefined();
    expect(instance.queue).toBeDefined();
  });
}); 