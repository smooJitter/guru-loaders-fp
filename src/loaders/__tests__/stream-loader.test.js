import { createStreamLoader } from '../stream-loader.js';
import { jest } from '@jest/globals';

describe('Stream Loader', () => {
  let streamLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    streamLoader = createStreamLoader();
  });

  test('should validate stream module correctly', () => {
    const validModule = {
      name: 'appStream',
      streams: { data: { type: 'data' } },
    };
    expect(streamLoader.validate(validModule)).toBe(true);
  });

  test('should transform stream module correctly', () => {
    const module = {
      name: 'appStream',
      streams: { data: { type: 'data' } },
    };
    const transformed = streamLoader.transform(module);
    expect(transformed.name).toBe('appStream');
    expect(transformed.streams.data.type).toBe('data');
  });

  test('should create stream instance correctly', async () => {
    const module = {
      name: 'appStream',
      streams: { data: { type: 'data' } },
    };
    const instance = await streamLoader.create(mockContext);
    expect(instance.pipe).toBeDefined();
    expect(instance.on).toBeDefined();
  });
}); 