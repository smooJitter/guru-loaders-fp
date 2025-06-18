import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('loader-core/loader-async', () => {
  let mockContext;
  let mockOptions;
  let createAsyncLoader;

  beforeEach(async () => {
    const loaderAsync = await import('../loader-async.js');
    createAsyncLoader = loaderAsync.createAsyncLoader;

    mockContext = {
      services: {
        logger: mockLogger
      }
    };

    mockOptions = {
      patterns: ['**/*.async.js'],
      validate: jest.fn().mockReturnValue(true),
      transform: jest.fn().mockImplementation(async (m) => m),
      watch: false,
      logger: mockContext.services.logger,
      importModule: jest.fn().mockResolvedValue({ test: true }),
      findFiles: mockFileUtils.findFiles.mockResolvedValue(['file1.async.js', 'file2.async.js']),
      onDuplicate: jest.fn(),
      onInvalid: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAsyncLoader', () => {
    it('should create an async loader that processes modules', async () => {
      const loader = createAsyncLoader('test', mockOptions);
      const { context, cleanup } = await loader(mockContext);

      expect(mockOptions.findFiles).toHaveBeenCalledWith(
        ['**/*.async.js'],
        {}
      );
      expect(mockOptions.importModule).toHaveBeenCalledTimes(2);
      expect(context.test).toBeDefined();
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should handle async transforms correctly', async () => {
      const asyncTransform = jest.fn().mockImplementation(
        async (m) => ({ ...m, transformed: true })
      );
      mockOptions.transform = asyncTransform;

      const loader = createAsyncLoader('test', mockOptions);
      const { context } = await loader(mockContext);

      expect(asyncTransform).toHaveBeenCalled();
      expect(context.test).toBeDefined();
    });

    it('should handle async validation correctly', async () => {
      const asyncValidate = jest.fn().mockImplementation(
        async () => Promise.resolve(true)
      );
      mockOptions.validate = asyncValidate;

      const loader = createAsyncLoader('test', mockOptions);
      const { context } = await loader(mockContext);

      expect(asyncValidate).toHaveBeenCalled();
      expect(context.test).toBeDefined();
    });

    it('should handle async errors gracefully', async () => {
      mockOptions.transform.mockRejectedValueOnce(new Error('Transform failed'));
      const loader = createAsyncLoader('test', mockOptions);
      const { context } = await loader(mockContext);

      expect(mockContext.services.logger.warn).toHaveBeenCalled();
      expect(context).toBeDefined();
    });

    it('should respect async registry transformations', async () => {
      mockOptions.registryType = 'event';
      mockOptions.transform = jest.fn().mockImplementation(
        async (m) => ({ ...m, event: 'test' })
      );

      const loader = createAsyncLoader('test', mockOptions);
      const { context } = await loader(mockContext);

      expect(context.test).toBeDefined();
      expect(mockOptions.transform).toHaveBeenCalled();
    });

    it('should handle file watching with async operations', async () => {
      mockOptions.watch = true;
      const loader = createAsyncLoader('test', mockOptions);
      const { context, cleanup } = await loader(mockContext);

      expect(cleanup).toBeInstanceOf(Function);
      await cleanup(); // Should not throw
    });

    it('should filter out invalid async modules', async () => {
      mockOptions.validate = jest.fn().mockImplementation(
        async () => Promise.resolve(false)
      );

      const loader = createAsyncLoader('test', mockOptions);
      const { context } = await loader(mockContext);

      expect(mockOptions.onInvalid).toHaveBeenCalled();
      expect(Object.keys(context.test || {})).toHaveLength(0);
    });
  });
}); 