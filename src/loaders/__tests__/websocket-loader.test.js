import { createWebsocketLoader } from '../websocket-loader.js';
import { jest } from '@jest/globals';

describe('Websocket Loader', () => {
  let websocketLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    websocketLoader = createWebsocketLoader();
  });

  test('should validate websocket module correctly', () => {
    const validModule = {
      name: 'appWebsocket',
      events: { message: jest.fn() },
    };
    expect(websocketLoader.validate(validModule)).toBe(true);
  });

  test('should transform websocket module correctly', () => {
    const module = {
      name: 'appWebsocket',
      events: { message: jest.fn() },
    };
    const transformed = websocketLoader.transform(module);
    expect(transformed.name).toBe('appWebsocket');
    expect(transformed.events.message).toBeDefined();
  });

  test('should create websocket instance correctly', async () => {
    const module = {
      name: 'appWebsocket',
      events: { message: jest.fn() },
    };
    const instance = await websocketLoader.create(mockContext);
    expect(instance.emit).toBeDefined();
    expect(instance.on).toBeDefined();
  });
}); 