import { jest } from '@jest/globals';
import { createEventLoader } from '../event-loader.js';

describe('Event Loader', () => {
  let mockContext;
  let mockLogger;
  let mockGlob;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    // Mock glob
    mockGlob = jest.fn();

    // Mock context
    mockContext = {
      logger: mockLogger,
      glob: mockGlob,
      rootDir: '/test/root',
      options: {
        patterns: {
          default: '**/events/**/*.event.js',
          index: '**/events/index.js'
        }
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEventLoader', () => {
    it('should create an event loader with default options', () => {
      const loader = createEventLoader();
      expect(loader).toBeDefined();
      expect(typeof loader).toBe('function');
    });

    it('should create an event loader with custom options', () => {
      const customOptions = {
        patterns: {
          default: 'custom/**/*.event.js'
        }
      };
      const loader = createEventLoader(customOptions);
      expect(loader).toBeDefined();
    });
  });

  describe('Event Loading', () => {
    it('should load valid event modules', async () => {
      const mockEventModule = {
        name: 'testEvent',
        handler: jest.fn(),
        options: { priority: 'high' }
      };

      mockGlob.mockResolvedValue(['/test/root/events/test.event.js']);
      jest.mock('/test/root/events/test.event.js', () => mockEventModule, { virtual: true });

      const loader = createEventLoader();
      const result = await loader(mockContext);

      expect(result).toBeDefined();
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        name: 'testEvent',
        type: 'event',
        options: { priority: 'high' }
      });
    });

    it('should reject invalid event modules', async () => {
      const invalidEventModule = {
        name: 'testEvent'
        // Missing handler
      };

      mockGlob.mockResolvedValue(['/test/root/events/invalid.event.js']);
      jest.mock('/test/root/events/invalid.event.js', () => invalidEventModule, { virtual: true });

      const loader = createEventLoader();
      await expect(loader(mockContext)).rejects.toThrow();
    });

    it('should handle empty event directories', async () => {
      mockGlob.mockResolvedValue([]);

      const loader = createEventLoader();
      const result = await loader(mockContext);

      expect(result).toBeDefined();
      expect(result.events).toHaveLength(0);
    });

    it('should handle glob errors', async () => {
      mockGlob.mockRejectedValue(new Error('Glob error'));

      const loader = createEventLoader();
      await expect(loader(mockContext)).rejects.toThrow('Glob error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Event Transformation', () => {
    it('should transform event modules correctly', async () => {
      const mockEventModule = {
        name: 'testEvent',
        handler: jest.fn(),
        options: { priority: 'high' }
      };

      mockGlob.mockResolvedValue(['/test/root/events/test.event.js']);
      jest.mock('/test/root/events/test.event.js', () => mockEventModule, { virtual: true });

      const loader = createEventLoader();
      const result = await loader(mockContext);

      const transformedEvent = result.events[0];
      expect(transformedEvent).toMatchObject({
        name: 'testEvent',
        type: 'event',
        options: { priority: 'high' },
        timestamp: expect.any(Number)
      });
      expect(typeof transformedEvent.handler).toBe('function');
    });

    it('should use default options when not provided', async () => {
      const mockEventModule = {
        name: 'testEvent',
        handler: jest.fn()
      };

      mockGlob.mockResolvedValue(['/test/root/events/test.event.js']);
      jest.mock('/test/root/events/test.event.js', () => mockEventModule, { virtual: true });

      const loader = createEventLoader();
      const result = await loader(mockContext);

      const transformedEvent = result.events[0];
      expect(transformedEvent.options).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle module loading errors', async () => {
      mockGlob.mockResolvedValue(['/test/root/events/error.event.js']);
      jest.mock('/test/root/events/error.event.js', () => {
        throw new Error('Module loading error');
      }, { virtual: true });

      const loader = createEventLoader();
      await expect(loader(mockContext)).rejects.toThrow('Module loading error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle invalid module exports', async () => {
      mockGlob.mockResolvedValue(['/test/root/events/invalid.event.js']);
      jest.mock('/test/root/events/invalid.event.js', () => null, { virtual: true });

      const loader = createEventLoader();
      await expect(loader(mockContext)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 