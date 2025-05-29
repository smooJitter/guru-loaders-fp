import { createTaskLoader } from '../task-loader.js';
import { jest } from '@jest/globals';

describe('Task Loader', () => {
  let taskLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    taskLoader = createTaskLoader();
  });

  test('should validate task module correctly', () => {
    const validModule = {
      name: 'appTask',
      tasks: { cleanup: { schedule: '0 0 * * *' } },
    };
    expect(taskLoader.validate(validModule)).toBe(true);
  });

  test('should transform task module correctly', () => {
    const module = {
      name: 'appTask',
      tasks: { cleanup: { schedule: '0 0 * * *' } },
    };
    const transformed = taskLoader.transform(module);
    expect(transformed.name).toBe('appTask');
    expect(transformed.tasks.cleanup.schedule).toBe('0 0 * * *');
  });

  test('should create task instance correctly', async () => {
    const module = {
      name: 'appTask',
      tasks: { cleanup: { schedule: '0 0 * * *' } },
    };
    const instance = await taskLoader.create(mockContext);
    expect(instance.run).toBeDefined();
    expect(instance.schedule).toBeDefined();
  });
}); 