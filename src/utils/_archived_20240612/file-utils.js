import path from 'path';
import fs from 'fs/promises';
import fg from 'fast-glob';
import * as R from 'ramda';

// Find files matching patterns
export const findFiles = (patterns) => {
  if (!Array.isArray(patterns)) return [];
  const files = patterns.flatMap(pattern => 
    fg.sync(pattern, { absolute: true })
  );
  return R.uniq(files);
};

// Import and apply context to module
export const importAndApply = async (file, context) => {
  const module = await import(file);
  return typeof module.default === 'function' 
    ? module.default(context)
    : module.default;
};

// Watch files for changes
export const watchFiles = (patterns, callback) => {
  if (!Array.isArray(patterns)) return () => {};
  if (typeof callback !== 'function') return () => {};
  const watchers = patterns.map(pattern => {
    const watcher = fs.watch(pattern, { recursive: true }, callback);
    return () => watcher.close();
  });
  return () => watchers.forEach(cleanup => cleanup());
};

// Get file metadata
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

// Read file content
export const readFile = async (file) => {
  if (!file) throw new Error('Invalid file');
  const content = await fs.readFile(file, 'utf-8');
  return {
    path: file,
    content
  };
};

// Write file content
export const writeFile = async (file, content) => {
  if (!file) throw new Error('Invalid file');
  await fs.writeFile(file, content, 'utf-8');
  return {
    path: file,
    content
  };
};

// Ensure directory exists
export const ensureDir = async (dir) => {
  if (!dir) throw new Error('Invalid dir');
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

// List directory contents
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

// Copy file
export const copyFile = async (src, dest) => {
  if (!src || !dest) throw new Error('Invalid src or dest');
  await fs.copyFile(src, dest);
  return {
    src,
    dest
  };
};

// Move file
export const moveFile = async (src, dest) => {
  if (!src || !dest) throw new Error('Invalid src or dest');
  await fs.rename(src, dest);
  return {
    src,
    dest
  };
};

// Delete file
export const deleteFile = async (file) => {
  if (!file) throw new Error('Invalid file');
  await fs.unlink(file);
  return file;
}; 