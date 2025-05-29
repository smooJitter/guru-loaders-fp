import { createIntegrationLoader } from '../integration-loader.js';
import { jest } from '@jest/globals';

describe('Integration Loader', () => {
  let integrationLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    integrationLoader = createIntegrationLoader();
  });

  test('should validate integration module correctly', () => {
    const validModule = {
      name: 'appIntegration',
      services: { slack: { webhook: 'https://hooks.slack.com' } },
    };
    expect(integrationLoader.validate(validModule)).toBe(true);
  });

  test('should transform integration module correctly', () => {
    const module = {
      name: 'appIntegration',
      services: { slack: { webhook: 'https://hooks.slack.com' } },
    };
    const transformed = integrationLoader.transform(module);
    expect(transformed.name).toBe('appIntegration');
    expect(transformed.services.slack.webhook).toBe('https://hooks.slack.com');
  });

  test('should create integration instance correctly', async () => {
    const module = {
      name: 'appIntegration',
      services: { slack: { webhook: 'https://hooks.slack.com' } },
    };
    const instance = await integrationLoader.create(mockContext);
    expect(instance.connect).toBeDefined();
    expect(instance.disconnect).toBeDefined();
  });
}); 