import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('loader-core/loader', () => {
  let mockContext;
  let mockOptions;
  let createFunctionalLoader;
  let processModule;
  let processModules;

  beforeEach(async () => {
    const loader = await import('../loader.js');
    createFunctionalLoader = loader.createFunctionalLoader;
    processModule = loader.processModule;
    processModules = loader.processModules;

    mockContext = {
      services: {
        logger: mockLogger
      }
    };

    mockOptions = {
      patterns: ['**/*.test.js'],
      validate: jest.fn().mockReturnValue(true),
      transform: jest.fn(m => m),
      watch: false,
      logger: mockContext.services.logger,
      importModule: jest.fn().mockResolvedValue({ test: true }),
      findFiles: mockFileUtils.findFiles.mockResolvedValue(['file1.test.js', 'file2.test.js']),
      onDuplicate: jest.fn(),
      onInvalid: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFunctionalLoader', () => {
    it('should create a loader that successfully loads and transforms modules', async () => {
      const loader = createFunctionalLoader('test', mockOptions);
      const { context, cleanup } = await loader(mockContext);

      expect(mockOptions.findFiles).toHaveBeenCalledWith(
        ['**/*.test.js'],
        {}
      );
      expect(mockOptions.importModule).toHaveBeenCalledTimes(2);
      expect(context.test).toBeDefined();
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should handle errors during file loading gracefully', async () => {
      mockOptions.findFiles.mockRejectedValueOnce(new Error('File not found'));
      const loader = createFunctionalLoader('test', mockOptions);
      const { context, cleanup } = await loader(mockContext);

      expect(mockContext.services.logger.error).toHaveBeenCalled();
      expect(context).toBeDefined();
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should respect custom registry type', async () => {
      mockOptions.registryType = 'event';
      const loader = createFunctionalLoader('test', mockOptions);
      const { context } = await loader(mockContext);

      expect(context.test).toBeDefined();
    });
  });

  describe('processModule', () => {
    it('should process a valid module successfully', async () => {
      const processor = processModule('test', mockOptions);
      const result = await processor('file1.test.js', mockContext);

      expect(result).toEqual({ test: true });
      expect(mockOptions.transform).toHaveBeenCalled();
      expect(mockOptions.validate).toHaveBeenCalled();
    });

    it('should handle invalid modules', async () => {
      mockOptions.validate.mockReturnValueOnce(false);
      const processor = processModule('test', mockOptions);
      const result = await processor('file1.test.js', mockContext);

      expect(result).toBeNull();
      expect(mockOptions.onInvalid).toHaveBeenCalled();
    });

    it('should handle import errors', async () => {
      mockOptions.importModule.mockRejectedValueOnce(new Error('Import failed'));
      const processor = processModule('test', mockOptions);
      const result = await processor('file1.test.js', mockContext);

      expect(result).toBeNull();
      expect(mockContext.services.logger.warn).toHaveBeenCalled();
    });
  });

  describe('processModules', () => {
    it('should process multiple modules in parallel', async () => {
      const processor = processModules('test', mockOptions);
      const files = ['file1.test.js', 'file2.test.js'];
      const results = await processor(files, mockContext);

      expect(results).toHaveLength(2);
      expect(mockOptions.importModule).toHaveBeenCalledTimes(2);
    });

    it('should filter out failed modules', async () => {
      mockOptions.importModule
        .mockResolvedValueOnce({ test: true })
        .mockRejectedValueOnce(new Error('Import failed'));

      const processor = processModules('test', mockOptions);
      const files = ['file1.test.js', 'file2.test.js'];
      const results = await processor(files, mockContext);

      expect(results).toHaveLength(1);
      expect(mockContext.services.logger.warn).toHaveBeenCalled();
    });
  });
}); 