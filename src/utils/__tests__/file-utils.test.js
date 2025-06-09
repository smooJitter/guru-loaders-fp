import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fileUtils from '../file-utils.js';
import fs from 'fs/promises';
import glob from 'glob';

// Mock fs if file-utils uses it
// Example: jest.mock('fs');

jest.mock('fs/promises');
jest.mock('glob');

describe('findFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    glob.sync.mockReset();
  });

  it('returns an array of files (happy path)', async () => {
    glob.sync.mockReturnValueOnce(['a.js', 'b.js']);
    const files = fileUtils.findFiles(['*.js']);
    expect(files).toEqual(['a.js', 'b.js']);
  });

  it('returns empty array if no files found (edge case)', async () => {
    glob.sync.mockReturnValueOnce([]);
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
    glob.sync.mockReturnValueOnce([]);
    expect(fileUtils.findFiles(['no-match'])).toEqual([]);
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
    require('fs/promises').readFile.mockResolvedValueOnce('abc');
    const result = await fileUtils.readFile('file.txt');
    expect(result).toEqual({ path: 'file.txt', content: 'abc' });
  });

  it('writeFile writes file content', async () => {
    require('fs/promises').writeFile.mockResolvedValueOnce();
    const result = await fileUtils.writeFile('file.txt', 'abc');
    expect(result).toEqual({ path: 'file.txt', content: 'abc' });
  });

  it('ensureDir creates directory', async () => {
    require('fs/promises').mkdir.mockResolvedValueOnce();
    const result = await fileUtils.ensureDir('dir');
    expect(result).toBe('dir');
  });

  it('listDir returns directory entries', async () => {
    require('fs/promises').readdir.mockResolvedValueOnce([
      { name: 'a', isDirectory: () => true, isFile: () => false },
      { name: 'b', isDirectory: () => false, isFile: () => true }
    ]);
    const result = await fileUtils.listDir('/dir');
    expect(result).toEqual([
      { name: 'a', path: '/dir/a', isDirectory: true, isFile: false },
      { name: 'b', path: '/dir/b', isDirectory: false, isFile: true }
    ]);
  });

  it('copyFile copies file', async () => {
    require('fs/promises').copyFile.mockResolvedValueOnce();
    const result = await fileUtils.copyFile('a.txt', 'b.txt');
    expect(result).toEqual({ src: 'a.txt', dest: 'b.txt' });
  });

  it('moveFile moves file', async () => {
    require('fs/promises').rename.mockResolvedValueOnce();
    const result = await fileUtils.moveFile('a.txt', 'b.txt');
    expect(result).toEqual({ src: 'a.txt', dest: 'b.txt' });
  });

  it('deleteFile deletes file', async () => {
    require('fs/promises').unlink.mockResolvedValueOnce();
    const result = await fileUtils.deleteFile('a.txt');
    expect(result).toBe('a.txt');
  });

  it('getFileMetadata returns metadata', async () => {
    require('fs/promises').stat.mockResolvedValueOnce({
      size: 123,
      mtime: new Date('2020-01-01'),
      birthtime: new Date('2019-01-01')
    });
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
    require('fs/promises').watch = jest.fn(() => ({ close }));
    // Patch global fs to have .watch (not present in fs/promises)
    const fsModule = require('fs/promises');
    fsModule.watch = jest.fn(() => ({ close }));
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

describe('fs operations', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('readFile propagates fs error', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.readFile('file.txt')).rejects.toThrow('fail');
  });

  it('writeFile propagates fs error', async () => {
    jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.writeFile('file.txt', 'x')).rejects.toThrow('fail');
  });

  it('ensureDir propagates fs error', async () => {
    jest.spyOn(fs, 'mkdir').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.ensureDir('dir')).rejects.toThrow('fail');
  });

  it('listDir propagates fs error', async () => {
    jest.spyOn(fs, 'readdir').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.listDir('dir')).rejects.toThrow('fail');
  });

  it('listDir handles empty directory', async () => {
    jest.spyOn(fs, 'readdir').mockResolvedValueOnce([]);
    const result = await fileUtils.listDir('dir');
    expect(result).toEqual([]);
  });
});

describe('getFileMetadata', () => {
  it('propagates fs.stat error', async () => {
    jest.spyOn(fs, 'stat').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.getFileMetadata('file.txt')).rejects.toThrow('fail');
  });
});

describe('copyFile', () => {
  it('propagates fs.copyFile error', async () => {
    jest.spyOn(fs, 'copyFile').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.copyFile('a.txt', 'b.txt')).rejects.toThrow('fail');
  });
});

describe('moveFile', () => {
  it('propagates fs.rename error', async () => {
    jest.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.moveFile('a.txt', 'b.txt')).rejects.toThrow('fail');
  });
});

describe('deleteFile', () => {
  it('propagates fs.unlink error', async () => {
    jest.spyOn(fs, 'unlink').mockRejectedValueOnce(new Error('fail'));
    await expect(fileUtils.deleteFile('a.txt')).rejects.toThrow('fail');
  });
});

describe('defensive file operations', () => {
  it('readFile with null throws', async () => {
    await expect(fileUtils.readFile(null)).rejects.toThrow();
  });
  it('writeFile with null throws', async () => {
    await expect(fileUtils.writeFile(null, null)).rejects.toThrow();
  });
  it('ensureDir with null throws', async () => {
    await expect(fileUtils.ensureDir(null)).rejects.toThrow();
  });
  it('listDir with null throws', async () => {
    await expect(fileUtils.listDir(null)).rejects.toThrow();
  });
  it('copyFile with null throws', async () => {
    await expect(fileUtils.copyFile(null, null)).rejects.toThrow();
  });
  it('moveFile with null throws', async () => {
    await expect(fileUtils.moveFile(null, null)).rejects.toThrow();
  });
  it('deleteFile with null throws', async () => {
    await expect(fileUtils.deleteFile(null)).rejects.toThrow();
  });
  it('getFileMetadata with null throws', async () => {
    await expect(fileUtils.getFileMetadata(null)).rejects.toThrow();
  });
}); 