import { createReportingLoader } from '../reporting-loader.js';
import { jest } from '@jest/globals';

describe('Reporting Loader', () => {
  let reportingLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    reportingLoader = createReportingLoader();
  });

  test('should validate reporting module correctly', () => {
    const validModule = {
      name: 'appReporting',
      reports: { sales: { type: 'sales' } },
    };
    expect(reportingLoader.validate(validModule)).toBe(true);
  });

  test('should transform reporting module correctly', () => {
    const module = {
      name: 'appReporting',
      reports: { sales: { type: 'sales' } },
    };
    const transformed = reportingLoader.transform(module);
    expect(transformed.name).toBe('appReporting');
    expect(transformed.reports.sales.type).toBe('sales');
  });

  test('should create reporting instance correctly', async () => {
    const module = {
      name: 'appReporting',
      reports: { sales: { type: 'sales' } },
    };
    const instance = await reportingLoader.create(mockContext);
    expect(instance.generate).toBeDefined();
    expect(instance.export).toBeDefined();
  });
}); 