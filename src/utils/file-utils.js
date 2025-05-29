import path from 'path';
import fs from 'fs/promises';
import glob from 'glob';
import R from 'ramda';

// Find files matching patterns
export const findFiles = (patterns) => {
  const files = patterns.flatMap(pattern => 
    glob.sync(pattern, { absolute: true })
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
  const watchers = patterns.map(pattern => {
    const watcher = fs.watch(pattern, { recursive: true }, callback);
    return () => watcher.close();
  });
  return () => watchers.forEach(cleanup => cleanup());
};

// Get file metadata
export const getFileMetadata = async (file) => {
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
  const content = await fs.readFile(file, 'utf-8');
  return {
    path: file,
    content
  };
};

// Write file content
export const writeFile = async (file, content) => {
  await fs.writeFile(file, content, 'utf-8');
  return {
    path: file,
    content
  };
};

// Ensure directory exists
export const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

// List directory contents
export const listDir = async (dir) => {
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
  await fs.copyFile(src, dest);
  return {
    src,
    dest
  };
};

// Move file
export const moveFile = async (src, dest) => {
  await fs.rename(src, dest);
  return {
    src,
    dest
  };
};

// Delete file
export const deleteFile = async (file) => {
  await fs.unlink(file);
  return file;
}; 