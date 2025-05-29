import { createEnvLoader } from '../env-loader.js';
import { jest } from '@jest/globals';

describe('Env Loader', () => {
  let envLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    envLoader = createEnvLoader();
  });

  test('should validate env module correctly', () => {
    const validModule = {
      name: 'appEnv',
      variables: { PORT: '3000', NODE_ENV: 'development' },
    };
    expect(envLoader.validate(validModule)).toBe(true);
  });

  test('should transform env module correctly', () => {
    const module = {
      name: 'appEnv',
      variables: { PORT: '3000', NODE_ENV: 'development' },
    };
    const transformed = envLoader.transform(module);
    expect(transformed.name).toBe('appEnv');
    expect(transformed.variables.PORT).toBe('3000');
  });

  test('should create env instance correctly', async () => {
    const module = {
      name: 'appEnv',
      variables: { PORT: '3000', NODE_ENV: 'development' },
    };
    const instance = await envLoader.create(mockContext);
    expect(instance.variables).toBeDefined();
  });
}); 