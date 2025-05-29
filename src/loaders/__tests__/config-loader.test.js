import { createConfigLoader } from '../config-loader.js';
import { jest } from '@jest/globals';

describe('Config Loader', () => {
  let configLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    configLoader = createConfigLoader();
  });

  test('should validate config module correctly', () => {
    const validModule = {
      name: 'appConfig',
      settings: { port: 3000 },
    };
    expect(configLoader.validate(validModule)).toBe(true);
  });

  test('should transform config module correctly', () => {
    const module = {
      name: 'appConfig',
      settings: { port: 3000 },
    };
    const transformed = configLoader.transform(module);
    expect(transformed.name).toBe('appConfig');
    expect(transformed.settings.port).toBe(3000);
  });

  test('should create config instance correctly', async () => {
    const module = {
      name: 'appConfig',
      settings: { port: 3000 },
    };
    const instance = await configLoader.create(mockContext);
    expect(instance.settings).toBeDefined();
  });
}); 