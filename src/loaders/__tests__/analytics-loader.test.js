import { createAnalyticsLoader } from '../analytics-loader.js';
import { jest } from '@jest/globals';

describe('Analytics Loader', () => {
  let analyticsLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    analyticsLoader = createAnalyticsLoader();
  });

  test('should validate analytics module correctly', () => {
    const validModule = {
      name: 'appAnalytics',
      events: { pageView: { type: 'page' } },
    };
    expect(analyticsLoader.validate(validModule)).toBe(true);
  });

  test('should transform analytics module correctly', () => {
    const module = {
      name: 'appAnalytics',
      events: { pageView: { type: 'page' } },
    };
    const transformed = analyticsLoader.transform(module);
    expect(transformed.name).toBe('appAnalytics');
    expect(transformed.events.pageView.type).toBe('page');
  });

  test('should create analytics instance correctly', async () => {
    const module = {
      name: 'appAnalytics',
      events: { pageView: { type: 'page' } },
    };
    const instance = await analyticsLoader.create(mockContext);
    expect(instance.track).toBeDefined();
    expect(instance.identify).toBeDefined();
  });
}); 