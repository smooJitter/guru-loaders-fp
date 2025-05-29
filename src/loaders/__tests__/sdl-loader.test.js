import { createSdlLoader } from '../sdl-loader.js';
import { jest } from '@jest/globals';

describe('SDL Loader', () => {
  let sdlLoader;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      services: {
        logger: {
          error: jest.fn(),
        },
      },
    };
    sdlLoader = createSdlLoader();
  });

  test('should validate sdl module correctly', () => {
    const validModule = {
      name: 'userSchema',
      sdl: 'type User { name: String, email: String }',
    };
    expect(sdlLoader.validate(validModule)).toBe(true);
  });

  test('should transform sdl module correctly', () => {
    const module = {
      name: 'userSchema',
      sdl: 'type User { name: String, email: String }',
    };
    const transformed = sdlLoader.transform(module);
    expect(transformed.name).toBe('userSchema');
    expect(transformed.sdl).toBe('type User { name: String, email: String }');
  });

  test('should create sdl instance correctly', async () => {
    const module = {
      name: 'userSchema',
      sdl: 'type User { name: String, email: String }',
    };
    const instance = await sdlLoader.create(mockContext);
    expect(instance.sdl).toBeDefined();
  });
}); 