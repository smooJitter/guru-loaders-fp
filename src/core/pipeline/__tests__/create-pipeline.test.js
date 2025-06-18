import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as validateUtils from '../../../utils/validate-utils.js';
import { createLoader } from '../create-pipeline.js';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockFindFiles = jest.fn(() => ['foo.js', 'bar.js']);
const mockValidateModule = jest.fn(() => true);
const mockDetectCircularDeps = jest.fn(() => false);
const mockValidateDependencies = jest.fn(() => Promise.resolve());
const mockValidateExports = jest.fn(() => Promise.resolve());

const fakeModules = [
  { name: 'foo', value: 1 },
  { name: 'bar', value: 2 }
];
const mockImportModule = jest.fn(async (file) => ({ default: fakeModules.find(m => file.includes(m.name)) }));

describe('createLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateModule.mockClear();
    mockDetectCircularDeps.mockClear();
    mockValidateDependencies.mockClear();
    mockValidateExports.mockClear();
  });

  it('loads and registers modules (happy path)', async () => {
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: mockValidateExports
    });
    const result = await loader({});
    expect(result.test.foo.value).toBe(1);
    expect(result.test.bar.value).toBe(2);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('handles no files found (edge case)', async () => {
    mockFindFiles.mockReturnValueOnce([]);
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: mockValidateExports
    });
    const result = await loader({});
    expect(result.test).toEqual({});
  });

  it('throws on circular dependencies (failure path)', async () => {
    mockDetectCircularDeps.mockReturnValueOnce(true);
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: mockValidateExports
    });
    await expect(loader({})).rejects.toThrow('Circular dependencies detected');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('skips invalid modules (validation failure path)', async () => {
    mockValidateModule.mockReturnValueOnce(false);
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: mockValidateExports
    });
    const result = await loader({});
    // Only 'bar' is valid, so only it should be present
    expect(result.test).toEqual({ bar: { name: 'bar', value: 2 } });
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('calls before and after plugin hooks', async () => {
    const before = jest.fn(async ctx => ({ ...ctx, before: true }));
    const after = jest.fn(async ctx => ({ ...ctx, after: true }));
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: mockValidateExports,
      plugins: [{ before, after }]
    });
    const result = await loader({});
    expect(before).toHaveBeenCalled();
    expect(after).toHaveBeenCalled();
    expect(result.after).toBe(true);
  });

  it('logs and throws if validateDependencies throws', async () => {
    const throwingValidateDependencies = jest.fn(() => { throw new Error('dep fail'); });
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: throwingValidateDependencies,
      validateExports: mockValidateExports
    });
    await expect(loader({})).rejects.toThrow('dep fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('logs and throws if validateExports throws', async () => {
    const throwingValidateExports = jest.fn(() => { throw new Error('exports fail'); });
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: throwingValidateExports
    });
    await expect(loader({})).rejects.toThrow('exports fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('sets up hot reload logic if watch is true', async () => {
    const loader = createLoader('test', {
      logger: mockLogger,
      importModule: mockImportModule,
      findFiles: mockFindFiles,
      validateModule: mockValidateModule,
      detectCircularDeps: mockDetectCircularDeps,
      validateDependencies: mockValidateDependencies,
      validateExports: mockValidateExports,
      watch: true
    });
    const result = await loader({});
    expect(result.watchers.test).toBeInstanceOf(Function);
    // Simulate cleanup
    result.watchers.test();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Hot reload enabled'));
  });
});

describe('createLoader uncovered branches', () => {
  const baseOptions = {
    logger: mockLogger,
    importModule: mockImportModule,
    findFiles: mockFindFiles,
    validateModule: mockValidateModule,
    detectCircularDeps: mockDetectCircularDeps,
    validateDependencies: mockValidateDependencies,
    validateExports: mockValidateExports
  };

  it('processModules: handles validateDependencies rejection', async () => {
    const throwingValidateDependencies = jest.fn(() => Promise.reject(new Error('dep fail')));
    const loader = createLoader('test', {
      ...baseOptions,
      validateDependencies: throwingValidateDependencies
    });
    await expect(loader({})).rejects.toThrow('dep fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('processModules: handles validateExports rejection', async () => {
    const throwingValidateExports = jest.fn(() => Promise.reject(new Error('exports fail')));
    const loader = createLoader('test', {
      ...baseOptions,
      validateExports: throwingValidateExports
    });
    await expect(loader({})).rejects.toThrow('exports fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('updateContext: hot reload cleanup is callable', async () => {
    const loader = createLoader('test', {
      ...baseOptions,
      watch: true
    });
    const result = await loader({});
    expect(typeof result.watchers.test).toBe('function');
    result.watchers.test(); // should not throw
  });

  it('pipeline: error thrown in before plugin', async () => {
    const before = jest.fn(async () => { throw new Error('before fail'); });
    const loader = createLoader('test', {
      ...baseOptions,
      plugins: [{ before }]
    });
    await expect(loader({})).rejects.toThrow('before fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('pipeline: error thrown in after plugin', async () => {
    const after = jest.fn(async () => { throw new Error('after fail'); });
    const loader = createLoader('test', {
      ...baseOptions,
      plugins: [{ after }]
    });
    await expect(loader({})).rejects.toThrow('after fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('pipeline: error thrown in pipeline steps', async () => {
    const badFindFiles = jest.fn(() => { throw new Error('findFiles fail'); });
    const loader = createLoader('test', {
      ...baseOptions,
      findFiles: badFindFiles
    });
    await expect(loader({})).rejects.toThrow('findFiles fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('pipeline: logger fallback if logger.error is missing', async () => {
    const badFindFiles = jest.fn(() => { throw new Error('findFiles fail'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const loader = createLoader('test', {
      ...baseOptions,
      logger: { info: jest.fn(), warn: jest.fn() }, // no error method
      findFiles: badFindFiles
    });
    await expect(loader({})).rejects.toThrow('findFiles fail');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Error in test loader:'),
      expect.any(Error)
    );
    spy.mockRestore();
  });
}); 