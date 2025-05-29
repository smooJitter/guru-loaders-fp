import { createFakerLoader } from '../faker-loader.js';
import { jest } from '@jest/globals';

describe('Faker Loader', () => {
  let fakerLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        db: {
          insertMany: jest.fn(),
        },
        logger: {
          error: jest.fn(),
        },
      },
    };
    fakerLoader = createFakerLoader();
  });

  test('should validate faker module correctly', () => {
    const validModule = {
      name: 'userFaker',
      model: 'User',
      count: 10,
      data: jest.fn(),
    };
    expect(fakerLoader.validate(validModule)).toBe(true);
  });

  test('should transform faker module correctly', () => {
    const module = {
      name: 'userFaker',
      model: 'User',
      count: 10,
      data: jest.fn(),
    };
    const transformed = fakerLoader.transform(module);
    expect(transformed.name).toBe('userFaker');
    expect(transformed.model).toBe('User');
    expect(transformed.count).toBe(10);
  });

  test('should create faker instance correctly', async () => {
    const module = {
      name: 'userFaker',
      model: 'User',
      count: 10,
      data: jest.fn(),
    };
    const instance = await fakerLoader.create(mockContext);
    expect(instance.seed).toBeDefined();
  });
}); 