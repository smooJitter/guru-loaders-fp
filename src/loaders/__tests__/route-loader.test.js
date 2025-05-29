import { createRouteLoader } from '../route-loader.js';
import { jest } from '@jest/globals';

describe('Route Loader', () => {
  let routeLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    routeLoader = createRouteLoader();
  });

  test('should validate route module correctly', () => {
    const validModule = {
      name: 'userRoutes',
      routes: [{ path: '/users', method: 'GET', handler: jest.fn() }],
    };
    expect(routeLoader.validate(validModule)).toBe(true);
  });

  test('should transform route module correctly', () => {
    const module = {
      name: 'userRoutes',
      routes: [{ path: '/users', method: 'GET', handler: jest.fn() }],
    };
    const transformed = routeLoader.transform(module);
    expect(transformed.name).toBe('userRoutes');
    expect(transformed.routes).toHaveLength(1);
  });

  test('should create route instance correctly', async () => {
    const module = {
      name: 'userRoutes',
      routes: [{ path: '/users', method: 'GET', handler: jest.fn() }],
    };
    const instance = await routeLoader.create(mockContext);
    expect(instance.routes).toBeDefined();
  });
}); 