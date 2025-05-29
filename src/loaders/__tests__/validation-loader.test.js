import { createValidationLoader } from '../validation-loader.js';
import { jest } from '@jest/globals';

describe('Validation Loader', () => {
  let validationLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    validationLoader = createValidationLoader();
  });

  test('should validate validation module correctly', () => {
    const validModule = {
      name: 'appValidation',
      schemas: { user: { type: 'object', properties: { name: { type: 'string' } } } },
    };
    expect(validationLoader.validate(validModule)).toBe(true);
  });

  test('should transform validation module correctly', () => {
    const module = {
      name: 'appValidation',
      schemas: { user: { type: 'object', properties: { name: { type: 'string' } } } },
    };
    const transformed = validationLoader.transform(module);
    expect(transformed.name).toBe('appValidation');
    expect(transformed.schemas.user.type).toBe('object');
  });

  test('should create validation instance correctly', async () => {
    const module = {
      name: 'appValidation',
      schemas: { user: { type: 'object', properties: { name: { type: 'string' } } } },
    };
    const instance = await validationLoader.create(mockContext);
    expect(instance.validate).toBeDefined();
  });
}); 