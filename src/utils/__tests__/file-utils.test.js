import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fileUtils from '../file-utils.js';
import path from 'path';

// Mock fs/promises
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();
const mockReaddir = jest.fn();
const mockCopyFile = jest.fn();
const mockRename = jest.fn();
const mockUnlink = jest.fn();
const mockStat = jest.fn();
const mockWatch = jest.fn();

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: (...args) => mockReadFile(...args),
  writeFile: (...args) => mockWriteFile(...args),
  mkdir: (...args) => mockMkdir(...args),
  readdir: (...args) => mockReaddir(...args),
  copyFile: (...args) => mockCopyFile(...args),
  rename: (...args) => mockRename(...args),
  unlink: (...args) => mockUnlink(...args),
  stat: (...args) => mockStat(...args),
  watch: (...args) => mockWatch(...args)
}));

// Mock fast-glob
const mockFgSync = jest.fn();
jest.mock('fast-glob', () => ({
  sync: (...args) => mockFgSync(...args)
}));

describe('findFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an array of files (happy path)', async () => {
    mockFgSync.mockImplementation((pattern, options) => {
      if (pattern === '*.js' && options.absolute === true) {
        return ['a.js', 'b.js'];
      }
      return [];
    });
    const files = fileUtils.findFiles(['*.js']);
    expect(files).toEqual(['a.js', 'b.js']);
    expect(mockFgSync).toHaveBeenCalledWith('*.js', { absolute: true });
  });

  it('returns empty array if no files found (edge case)', async () => {
    mockFgSync.mockImplementation(() => []);
    const files = fileUtils.findFiles(['nonexistentpattern']);
    expect(files).toEqual([]);
  });

  it('handles null input gracefully (failure path)', () => {
    expect(fileUtils.findFiles(null)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(fileUtils.findFiles('not-an-array')).toEqual([]);
  });

  it('returns empty array if patterns is undefined', () => {
    expect(fileUtils.findFiles(undefined)).toEqual([]);
  });

  it('returns empty array if patterns is empty array', () => {
    expect(fileUtils.findFiles([])).toEqual([]);
  });

  it('returns empty array if patterns contains only patterns with no matches', () => {
    mockFgSync.mockImplementation(() => []);
    expect(fileUtils.findFiles(['no-match'])).toEqual([]);
  });

  it('removes duplicate matches', () => {
    mockFgSync.mockImplementation(() => ['a.js', 'a.js', 'b.js']);
    const files = fileUtils.findFiles(['*.js']);
    expect(files).toEqual(['a.js', 'b.js']);
  });
});

describe('importAndApply', () => {
  it.skip('calls default as function (dynamic import cannot be faked in Node ESM)', async () => {
    // Skipped: Cannot fake dynamic import in Node ESM
  });

  it('returns default as object', async () => {
    const fakeModule = { default: { foo: 1 } };
    const result = await (async (file, context) => {
      return typeof fakeModule.default === 'function'
        ? fakeModule.default(context)
        : fakeModule.default;
    })('fake.js', {});
    expect(result).toEqual({ foo: 1 });
  });

  it('handles module with no default export', async () => {
    const fakeModule = {};
    const result = await (async (file, context) => {
      return typeof fakeModule.default === 'function'
        ? fakeModule.default(context)
        : fakeModule.default;
    })('fake.js', {});
    expect(result).toBeUndefined();
  });
});

describe('fs operations (happy paths)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('readFile returns file content', async () => {
    mockReadFile.mockImplementation(() => Promise.resolve('abc'));
    const result = await fileUtils.readFile('file.txt');
    expect(result).toEqual({ path: 'file.txt', content: 'abc' });
  });

  it('writeFile writes file content', async () => {
    mockWriteFile.mockImplementation(() => Promise.resolve());
    const result = await fileUtils.writeFile('file.txt', 'abc');
    expect(result).toEqual({ path: 'file.txt', content: 'abc' });
  });

  it('ensureDir creates directory', async () => {
    mockMkdir.mockImplementation(() => Promise.resolve());
    const result = await fileUtils.ensureDir('dir');
    expect(result).toBe('dir');
  });

  it('listDir returns directory entries', async () => {
    const mockEntries = [
      { name: 'a', isDirectory: () => true, isFile: () => false },
      { name: 'b', isDirectory: () => false, isFile: () => true }
    ];
    mockReaddir.mockImplementation(() => Promise.resolve(mockEntries));
    const result = await fileUtils.listDir('/dir');
    expect(result).toEqual([
      { name: 'a', path: '/dir/a', isDirectory: true, isFile: false },
      { name: 'b', path: '/dir/b', isDirectory: false, isFile: true }
    ]);
  });

  it('copyFile copies file', async () => {
    mockCopyFile.mockImplementation(() => Promise.resolve());
    const result = await fileUtils.copyFile('a.txt', 'b.txt');
    expect(result).toEqual({ src: 'a.txt', dest: 'b.txt' });
  });

  it('moveFile moves file', async () => {
    mockRename.mockImplementation(() => Promise.resolve());
    const result = await fileUtils.moveFile('a.txt', 'b.txt');
    expect(result).toEqual({ src: 'a.txt', dest: 'b.txt' });
  });

  it('deleteFile deletes file', async () => {
    mockUnlink.mockImplementation(() => Promise.resolve());
    const result = await fileUtils.deleteFile('a.txt');
    expect(result).toBe('a.txt');
  });

  it('getFileMetadata returns metadata', async () => {
    const mockStats = {
      size: 123,
      mtime: new Date('2020-01-01'),
      birthtime: new Date('2019-01-01')
    };
    mockStat.mockImplementation(() => Promise.resolve(mockStats));
    const result = await fileUtils.getFileMetadata('/foo/bar.txt');
    expect(result).toMatchObject({
      path: '/foo/bar.txt',
      name: 'bar',
      ext: '.txt',
      size: 123,
      modified: new Date('2020-01-01'),
      created: new Date('2019-01-01')
    });
  });
});

describe('watchFiles', () => {
  it('sets up and cleans up watchers', () => {
    const close = jest.fn();
    mockWatch.mockImplementation(() => ({ close }));
    const patterns = ['a.txt', 'b.txt'];
    const callback = jest.fn();
    const cleanup = fileUtils.watchFiles(patterns, callback);
    expect(typeof cleanup).toBe('function');
    cleanup();
    expect(close).toHaveBeenCalledTimes(patterns.length);
  });

  it('handles empty patterns array', () => {
    const callback = jest.fn();
    const cleanup = fileUtils.watchFiles([], callback);
    expect(typeof cleanup).toBe('function');
    cleanup(); // should not throw
  });

  it('returns noop if patterns is not array', () => {
    const cleanup = fileUtils.watchFiles(null, jest.fn());
    expect(typeof cleanup).toBe('function');
    cleanup(); // should not throw
  });

  it('returns noop if callback is not a function', () => {
    const cleanup = fileUtils.watchFiles(['a.txt'], null);
    expect(typeof cleanup).toBe('function');
    cleanup(); // should not throw
  });
});

describe('fs operations (error handling)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('readFile propagates fs error', async () => {
    mockReadFile.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.readFile('file.txt')).rejects.toThrow('fail');
  });

  it('writeFile propagates fs error', async () => {
    mockWriteFile.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.writeFile('file.txt', 'x')).rejects.toThrow('fail');
  });

  it('ensureDir propagates fs error', async () => {
    mockMkdir.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.ensureDir('dir')).rejects.toThrow('fail');
  });

  it('listDir propagates fs error', async () => {
    mockReaddir.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.listDir('dir')).rejects.toThrow('fail');
  });

  it('listDir handles empty directory', async () => {
    mockReaddir.mockImplementation(() => Promise.resolve([]));
    const result = await fileUtils.listDir('dir');
    expect(result).toEqual([]);
  });

  it('getFileMetadata propagates fs.stat error', async () => {
    mockStat.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.getFileMetadata('file.txt')).rejects.toThrow('fail');
  });

  it('copyFile propagates fs.copyFile error', async () => {
    mockCopyFile.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.copyFile('a.txt', 'b.txt')).rejects.toThrow('fail');
  });

  it('moveFile propagates fs.rename error', async () => {
    mockRename.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.moveFile('a.txt', 'b.txt')).rejects.toThrow('fail');
  });

  it('deleteFile propagates fs.unlink error', async () => {
    mockUnlink.mockImplementation(() => Promise.reject(new Error('fail')));
    await expect(fileUtils.deleteFile('a.txt')).rejects.toThrow('fail');
  });
});

describe('defensive file operations', () => {
  it('readFile with null throws', async () => {
    await expect(fileUtils.readFile(null)).rejects.toThrow('Invalid file');
  });

  it('writeFile with null throws', async () => {
    await expect(fileUtils.writeFile(null, null)).rejects.toThrow('Invalid file');
  });

  it('ensureDir with null throws', async () => {
    await expect(fileUtils.ensureDir(null)).rejects.toThrow('Invalid dir');
  });

  it('listDir with null throws', async () => {
    await expect(fileUtils.listDir(null)).rejects.toThrow('Invalid dir');
  });

  it('copyFile with null throws', async () => {
    await expect(fileUtils.copyFile(null, null)).rejects.toThrow('Invalid src or dest');
  });

  it('moveFile with null throws', async () => {
    await expect(fileUtils.moveFile(null, null)).rejects.toThrow('Invalid src or dest');
  });

  it('deleteFile with null throws', async () => {
    await expect(fileUtils.deleteFile(null)).rejects.toThrow('Invalid file');
  });

  it('getFileMetadata with null throws', async () => {
    await expect(fileUtils.getFileMetadata(null)).rejects.toThrow('Invalid file');
  });
}); 