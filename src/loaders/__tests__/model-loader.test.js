import { createModelLoader } from '../model-loader.js';
import { jest } from '@jest/globals';

describe('Model Loader', () => {
  let modelLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        db: {
          model: jest.fn(),
        },
        logger: {
          error: jest.fn(),
        },
      },
    };
    modelLoader = createModelLoader();
  });

  test('should validate model module correctly', () => {
    const validModule = {
      name: 'User',
      schema: { name: String, email: String },
    };
    expect(modelLoader.validate(validModule)).toBe(true);
  });

  test('should transform model module correctly', () => {
    const module = {
      name: 'User',
      schema: { name: String, email: String },
    };
    const transformed = modelLoader.transform(module);
    expect(transformed.name).toBe('User');
    expect(transformed.schema).toEqual({ name: String, email: String });
  });

  test('should create model instance correctly', async () => {
    const module = {
      name: 'User',
      schema: { name: String, email: String },
    };
    const instance = await modelLoader.create(mockContext);
    expect(instance.model).toBeDefined();
  });
}); 