import { createSearchLoader } from '../search-loader.js';
import { jest } from '@jest/globals';

describe('Search Loader', () => {
  let searchLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    searchLoader = createSearchLoader();
  });

  test('should validate search module correctly', () => {
    const validModule = {
      name: 'appSearch',
      indices: { users: { mappings: { name: { type: 'text' } } } },
    };
    expect(searchLoader.validate(validModule)).toBe(true);
  });

  test('should transform search module correctly', () => {
    const module = {
      name: 'appSearch',
      indices: { users: { mappings: { name: { type: 'text' } } } },
    };
    const transformed = searchLoader.transform(module);
    expect(transformed.name).toBe('appSearch');
    expect(transformed.indices.users.mappings.name.type).toBe('text');
  });

  test('should create search instance correctly', async () => {
    const module = {
      name: 'appSearch',
      indices: { users: { mappings: { name: { type: 'text' } } } },
    };
    const instance = await searchLoader.create(mockContext);
    expect(instance.search).toBeDefined();
    expect(instance.index).toBeDefined();
  });
}); 