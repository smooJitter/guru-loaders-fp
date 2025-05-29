import { createTypeLoader } from '../type-loader.js';
import { jest } from '@jest/globals';

describe('Type Loader', () => {
  let typeLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        builder: {
          objectType: jest.fn(),
        },
        logger: {
          error: jest.fn(),
        },
      },
    };
    typeLoader = createTypeLoader();
  });

  test('should validate type module correctly', () => {
    const validModule = {
      name: 'UserType',
      fields: { name: 'String', email: 'String' },
    };
    expect(typeLoader.validate(validModule)).toBe(true);
  });

  test('should transform type module correctly', () => {
    const module = {
      name: 'UserType',
      fields: { name: 'String', email: 'String' },
    };
    const transformed = typeLoader.transform(module);
    expect(transformed.name).toBe('UserType');
    expect(transformed.fields).toEqual({ name: 'String', email: 'String' });
  });

  test('should create type instance correctly', async () => {
    const module = {
      name: 'UserType',
      fields: { name: 'String', email: 'String' },
    };
    const instance = await typeLoader.create(mockContext);
    expect(instance.type).toBeDefined();
  });
}); 