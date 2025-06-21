import fg from 'fast-glob';
import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';

/**
 * Find files matching glob patterns, with advanced fast-glob options.
 * @param {string[]} patterns - Array of glob patterns (supports negation).
 * @param {object} [options] - Additional fast-glob options.
 * @returns {Promise<string[]>} - Array of unique, absolute file paths.
 */
export const findFiles = async (
  patterns,
  options = {}
) => {
  if (!Array.isArray(patterns) || patterns.length === 0) return [];
  const validPatterns = patterns.filter(p => typeof p === 'string' && p.length > 0);
  if (validPatterns.length === 0) return [];

  // Strategic defaults for most use-cases
  const fgOptions = {
    absolute: true,           // Always return absolute paths
    onlyFiles: true,          // Only files, not directories
    unique: true,             // Deduplicate results
    dot: true,                // Include dotfiles (hidden files)
    followSymbolicLinks: true,// Follow symlinks
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'], // Common ignores
    ...options,               // Allow caller to override/add options
  };

  return await fg(validPatterns, fgOptions);
};

/**
 * Find directories matching glob patterns.
 * @param {string[]} patterns
 * @param {object} [options]
 * @returns {Promise<string[]>}
 */
export const findDirectories = async (
  patterns,
  options = {}
) => {
  if (!Array.isArray(patterns) || patterns.length === 0) return [];
  const validPatterns = patterns.filter(p => typeof p === 'string' && p.length > 0);
  if (validPatterns.length === 0) return [];

  const fgOptions = {
    absolute: true,
    onlyDirectories: true,
    unique: true,
    dot: true,
    followSymbolicLinks: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    ...options,
  };

  return await fg(validPatterns, fgOptions);
};

/**
 * Stream files matching patterns (for huge sets).
 * @param {string[]} patterns
 * @param {object} [options]
 * @returns {AsyncGenerator<string>}
 */
export const streamFiles = (patterns, options = {}) => {
  if (!Array.isArray(patterns) || patterns.length === 0) return (async function*(){})();
  const validPatterns = patterns.filter(p => typeof p === 'string' && p.length > 0);
  if (validPatterns.length === 0) return (async function*(){})();
  const fgOptions = {
    absolute: true,
    onlyFiles: true,
    unique: true,
    dot: true,
    followSymbolicLinks: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    ...options,
  };
  return fg.stream(validPatterns, fgOptions);
};

/**
 * Find files and return stats (size, mtime, etc).
 * @param {string[]} patterns
 * @param {object} [options]
 * @returns {Promise<object[]>} - Array of {path, stats}
 */
export const findFilesWithStats = async (
  patterns,
  options = {}
) => {
  if (!Array.isArray(patterns) || patterns.length === 0) return [];
  const validPatterns = patterns.filter(p => typeof p === 'string' && p.length > 0);
  if (validPatterns.length === 0) return [];

  const fgOptions = {
    absolute: true,
    onlyFiles: true,
    unique: true,
    dot: true,
    followSymbolicLinks: true,
    stats: true, // <-- This is the key!
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    ...options,
  };

  // Each entry is {path, stats}
  return await fg(validPatterns, fgOptions);
};

/**
 * Import and apply context to module
 */
export const importAndApply = async (file, context) => {
  const module = await import(file);
  return typeof module.default === 'function' 
    ? module.default(context)
    : module.default;
};

/**
 * Import and apply context to an array of modules
 */
export const importAndApplyAll = async (files, context) =>
  Promise.all((files || []).map(file => importAndApply(file, context)));

/**
 * Watch files for changes using chokidar (supports glob patterns)
 */
export const watchFiles = (patterns, callback, options = {}) => {
  if (!Array.isArray(patterns) || typeof callback !== 'function') return () => {};
  const watcher = chokidar.watch(patterns, { ignoreInitial: true, ...options });
  watcher.on('all', callback);
  return () => watcher.close();
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (file) => {
  if (!file) throw new Error('Invalid file');
  const stats = await fs.stat(file);
  return {
    path: file,
    name: path.basename(file, path.extname(file)),
    ext: path.extname(file),
    size: stats.size,
    modified: stats.mtime,
    created: stats.birthtime
  };
};

/**
 * Read file content
 */
export const readFile = async (file) => {
  if (!file) throw new Error('Invalid file');
  const content = await fs.readFile(file, 'utf-8');
  return {
    path: file,
    content
  };
};

/**
 * Write file content
 */
export const writeFile = async (file, content) => {
  if (!file) throw new Error('Invalid file');
  await fs.writeFile(file, content, 'utf-8');
  return {
    path: file,
    content
  };
};

/**
 * Ensure directory exists
 */
export const ensureDir = async (dir) => {
  if (!dir) throw new Error('Invalid dir');
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

/**
 * List directory contents
 */
export const listDir = async (dir) => {
  if (!dir) throw new Error('Invalid dir');
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.map(entry => ({
    name: entry.name,
    path: path.join(dir, entry.name),
    isDirectory: entry.isDirectory(),
    isFile: entry.isFile()
  }));
};

/**
 * Copy file
 */
export const copyFile = async (src, dest) => {
  if (!src || !dest) throw new Error('Invalid src or dest');
  await fs.copyFile(src, dest);
  return {
    src,
    dest
  };
};

/**
 * Move file
 */
export const moveFile = async (src, dest) => {
  if (!src || !dest) throw new Error('Invalid src or dest');
  await fs.rename(src, dest);
  return {
    src,
    dest
  };
};

/**
 * Delete file
 */
export const deleteFile = async (file) => {
  if (!file) throw new Error('Invalid file');
  await fs.unlink(file);
  return file;
};

/**
 * Synchronously find files matching glob patterns using fast-glob.
 * @param {string[]} patterns - Array of glob patterns
 * @param {object} [options] - fast-glob options
 * @returns {string[]} - Array of file paths
 */
export const findFilesSync = (patterns, options = {}) =>
  fg.sync(patterns, {
    absolute: true,
    onlyFiles: true,
    unique: true,
    dot: true,
    followSymbolicLinks: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    ...options,
  });

/**
 * Synchronously import and apply context to an array of modules
 * @param {string[]} files
 * @param {object} context
 * @returns {Array}
 */
export const importAndApplyAllSync = (files, context) =>
  (files || []).map(file => {
    const mod = require(file);
    return typeof mod === 'function'
      ? mod(context)
      : (mod.default !== undefined ? mod.default : mod);
  });

/**
 * Import and apply context to an array of feature paths (files or directories).
 * For directories, imports index.js only (per project convention, ESM).
 * No .mjs or .cjs is supported or expected.
 * @param {string[]} paths
 * @param {object} context
 * @returns {Promise<Array>} Array of imported modules/features
 */
export const importAndApplyAllFeatures = async (paths, context) => {
  const results = [];
  // Prefer context.services.logger, fallback to console
  const logger = context?.services?.logger || console;
  for (const p of paths || []) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        // Only check for index.js as entrypoint
        const entry = path.join(p, 'index.js');
        try {
          logger.info?.('[importAndApplyAllFeatures] Trying entry:', entry);
          const feature = await importAndApply(entry, context);
          results.push(feature);
          logger.info?.('[importAndApplyAllFeatures] Successfully imported:', entry);
        } catch (e) {
          logger.error?.('[importAndApplyAllFeatures] Failed to import', entry, e);
          logger.warn?.('[importAndApplyAllFeatures] No valid index.js found in directory:', p);
        }
      } else {
        // Regular file
        try {
          logger.info?.('[importAndApplyAllFeatures] Importing file:', p);
          const mod = await importAndApply(p, context);
          results.push(mod);
          logger.info?.('[importAndApplyAllFeatures] Successfully imported file:', p);
        } catch (e) {
          logger.error?.('[importAndApplyAllFeatures] Failed to import file', p, e);
        }
      }
    } catch (err) {
      logger.error?.('[importAndApplyAllFeatures] Stat error for', p, err);
    }
  }
  return results;
};

/**
 * Find both files and directories matching glob patterns.
 * @param {string[]} patterns
 * @param {object} [options]
 * @returns {Promise<string[]>}
 */
export const findFilesAndDirs = async (patterns, options = {}) => {
  if (!Array.isArray(patterns) || patterns.length === 0) return [];
  const validPatterns = patterns.filter(p => typeof p === 'string' && p.length > 0);
  if (validPatterns.length === 0) return [];
  const fgOptions = {
    absolute: true,
    unique: true,
    dot: true,
    followSymbolicLinks: true,
    markDirectories: true,
    onlyFiles: false,
    onlyDirectories: false,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    ...options,
  };
  return await fg(validPatterns, fgOptions);
}; 