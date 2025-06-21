/**
 * Returns a mock findFiles function for loader-core tests.
 * @param {Array} files - Array of file paths to return
 * @returns {Function}
 */
export const mockFindFiles = files => () => files;

/**
 * Returns a mock importAndApplyAll function for loader-core tests.
 * @param {Array} modules - Array of modules to return
 * @returns {Function}
 */
export const mockImportAndApplyAll = modules => () => modules;
