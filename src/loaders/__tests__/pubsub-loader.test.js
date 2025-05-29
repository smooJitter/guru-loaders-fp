import { createPubsubLoader } from '../pubsub-loader.js';
import { jest } from '@jest/globals';

describe('PubSub Loader', () => {
  let pubsubLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        pubsub: {
          asyncIterator: jest.fn(),
          publish: jest.fn(),
          subscribe: jest.fn(),
        },
        logger: {
          error: jest.fn(),
        },
      },
    };
    pubsubLoader = createPubsubLoader();
  });

  test('should validate pubsub module correctly', () => {
    const validModule = {
      name: 'userEvents',
      topics: { USER_CREATED: 'USER_CREATED' },
      handlers: { USER_CREATED: jest.fn() },
    };
    expect(pubsubLoader.validate(validModule)).toBe(true);
  });

  test('should transform pubsub module correctly', () => {
    const module = {
      name: 'userEvents',
      topics: { USER_CREATED: 'USER_CREATED' },
      handlers: { USER_CREATED: jest.fn() },
    };
    const transformed = pubsubLoader.transform(module);
    expect(transformed.name).toBe('userEvents');
    expect(transformed.topics.USER_CREATED).toBe('USER_CREATED');
  });

  test('should create pubsub instance correctly', async () => {
    const module = {
      name: 'userEvents',
      topics: { USER_CREATED: 'USER_CREATED' },
      handlers: { USER_CREATED: jest.fn() },
    };
    const instance = await pubsubLoader.create(mockContext);
    expect(instance.publish).toBeDefined();
    expect(instance.subscribe).toBeDefined();
  });
}); 