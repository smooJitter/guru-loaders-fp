import { createMetricsLoader } from '../metrics-loader.js';
import { jest } from '@jest/globals';

describe('Metrics Loader', () => {
  let metricsLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    metricsLoader = createMetricsLoader();
  });

  test('should validate metrics module correctly', () => {
    const validModule = {
      name: 'appMetrics',
      metrics: { requestCount: { type: 'counter' } },
    };
    expect(metricsLoader.validate(validModule)).toBe(true);
  });

  test('should transform metrics module correctly', () => {
    const module = {
      name: 'appMetrics',
      metrics: { requestCount: { type: 'counter' } },
    };
    const transformed = metricsLoader.transform(module);
    expect(transformed.name).toBe('appMetrics');
    expect(transformed.metrics.requestCount.type).toBe('counter');
  });

  test('should create metrics instance correctly', async () => {
    const module = {
      name: 'appMetrics',
      metrics: { requestCount: { type: 'counter' } },
    };
    const instance = await metricsLoader.create(mockContext);
    expect(instance.increment).toBeDefined();
    expect(instance.gauge).toBeDefined();
  });
}); 