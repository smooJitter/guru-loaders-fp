/**
 * This hook logs errors to the host app's logger if present.
 * It does NOT use the internal guru-loaders-fp logger, to avoid context pollution.
 *
 * @function errorHandlingHook
 * @description Wraps an async function and logs errors using the context's logger. Intended for use in loader pipelines or modular steps.
 * @param {function} fn - The async function to execute.
 * @param {object} context - The loader or app context containing a logger.
 * @param {...any} args - Arguments to pass to the function.
 * @returns {Promise<any>} The result of the function if successful.
 * @throws {Error} Rethrows any error after logging.
 */
export const errorHandlingHook = async (fn, context, ...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    if (context?.services?.logger?.error) {
      context.services.logger.error('Error occurred:', error);
    } else if (context?.logger?.error) {
      context.logger.error('Error occurred:', error);
    } else {
      console.error('Error occurred:', error);
    }
    throw error;
  }
};

/**
 * Higher-order function to wrap an async function with error handling and optional onError callback.
 * @param {Function} fn - The async function to wrap.
 * @param {Object} [options] - Options object.
 * @param {Function} [options.onError] - Optional error handler (async).
 * @returns {Function} Wrapped async function.
 */
export const withErrorHandling = (fn, options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (options.onError) {
        try {
          await options.onError(error);
        } catch (hookErr) {
          console.error('onError hook failed', hookErr);
        }
      }
      throw error;
    }
  };
}; 