import { createActionLoader } from '../action-loader.js';
import { jest } from '@jest/globals';

describe('Action Loader', () => {
  let actionLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    actionLoader = createActionLoader();
  });

  test('should validate action module correctly', () => {
    const validModule = {
      name: 'createUser',
      execute: jest.fn(),
    };
    expect(actionLoader.validate(validModule)).toBe(true);
  });

  test('should transform action module correctly', () => {
    const module = {
      name: 'createUser',
      execute: jest.fn(),
    };
    const transformed = actionLoader.transform(module);
    expect(transformed.name).toBe('createUser');
    expect(transformed.execute).toBeDefined();
  });

  test('should create action instance correctly', async () => {
    const module = {
      name: 'createUser',
      execute: jest.fn(),
    };
    const instance = await actionLoader.create(mockContext);
    expect(instance.execute).toBeDefined();
  });
}); 