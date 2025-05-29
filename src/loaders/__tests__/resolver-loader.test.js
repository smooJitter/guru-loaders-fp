import { createResolverLoader } from '../resolver-loader.js';
import { jest } from '@jest/globals';

describe('Resolver Loader', () => {
  let resolverLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    resolverLoader = createResolverLoader();
  });

  test('should validate resolver module correctly', () => {
    const validModule = {
      name: 'userResolver',
      resolve: jest.fn(),
    };
    expect(resolverLoader.validate(validModule)).toBe(true);
  });

  test('should transform resolver module correctly', () => {
    const module = {
      name: 'userResolver',
      resolve: jest.fn(),
    };
    const transformed = resolverLoader.transform(module);
    expect(transformed.name).toBe('userResolver');
    expect(transformed.resolve).toBeDefined();
  });

  test('should create resolver instance correctly', async () => {
    const module = {
      name: 'userResolver',
      resolve: jest.fn(),
    };
    const instance = await resolverLoader.create(mockContext);
    expect(instance.resolve).toBeDefined();
  });
}); 