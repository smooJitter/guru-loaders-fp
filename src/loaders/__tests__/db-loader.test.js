import { createDbLoader } from '../db-loader.js';
import { jest } from '@jest/globals';

describe('DB Loader', () => {
  let dbLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        db: {
          connect: jest.fn(),
          disconnect: jest.fn(),
        },
        logger: {
          error: jest.fn(),
        },
      },
    };
    dbLoader = createDbLoader();
  });

  test('should validate db module correctly', () => {
    const validModule = {
      name: 'appDb',
      uri: 'mongodb://localhost:27017/app',
    };
    expect(dbLoader.validate(validModule)).toBe(true);
  });

  test('should transform db module correctly', () => {
    const module = {
      name: 'appDb',
      uri: 'mongodb://localhost:27017/app',
    };
    const transformed = dbLoader.transform(module);
    expect(transformed.name).toBe('appDb');
    expect(transformed.uri).toBe('mongodb://localhost:27017/app');
  });

  test('should create db instance correctly', async () => {
    const module = {
      name: 'appDb',
      uri: 'mongodb://localhost:27017/app',
    };
    const instance = await dbLoader.create(mockContext);
    expect(instance.connect).toBeDefined();
    expect(instance.disconnect).toBeDefined();
  });
}); 