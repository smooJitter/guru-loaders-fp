import { createSchedulerLoader } from '../scheduler-loader.js';
import { jest } from '@jest/globals';

describe('Scheduler Loader', () => {
  let schedulerLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    schedulerLoader = createSchedulerLoader();
  });

  test('should validate scheduler module correctly', () => {
    const validModule = {
      name: 'appScheduler',
      jobs: { cleanup: { cron: '0 0 * * *' } },
    };
    expect(schedulerLoader.validate(validModule)).toBe(true);
  });

  test('should transform scheduler module correctly', () => {
    const module = {
      name: 'appScheduler',
      jobs: { cleanup: { cron: '0 0 * * *' } },
    };
    const transformed = schedulerLoader.transform(module);
    expect(transformed.name).toBe('appScheduler');
    expect(transformed.jobs.cleanup.cron).toBe('0 0 * * *');
  });

  test('should create scheduler instance correctly', async () => {
    const module = {
      name: 'appScheduler',
      jobs: { cleanup: { cron: '0 0 * * *' } },
    };
    const instance = await schedulerLoader.create(mockContext);
    expect(instance.schedule).toBeDefined();
    expect(instance.cancel).toBeDefined();
  });
}); 