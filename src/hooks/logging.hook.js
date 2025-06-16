/**
 * This hook logs messages to the host app's logger if present.
 * It does NOT use the internal guru-loaders-fp logger, to avoid context pollution.
 *
 * @function loggingHook
 * @description Logs a message using the context's logger. Intended for use in loader pipelines or modular steps to provide context-aware logging.
 * @param {object} context - The loader or app context containing a logger.
 * @param {string} message - The message to log.
 * @returns {object} The unchanged context.
 */
export const loggingHook = (context, message) => {
  if (context && context.logger && typeof context.logger.info === 'function') {
    context.logger.info(message);
  } else {
    console.info(message);
  }
  return context;
};

/**
 * Logs the start of a pipeline step with a consistent prefix.
 * @param {string} step - The step or operation name.
 * @param {object} context - The loader or app context containing a logger.
 */
export const logStart = (step, context) => {
  if (context && context.logger && typeof context.logger.info === 'function') {
    context.logger.info(`[START] ${step}`);
  }
};

/**
 * Logs the end of a pipeline step with a consistent prefix.
 * @param {string} step - The step or operation name.
 * @param {object} context - The loader or app context containing a logger.
 */
export const logEnd = (step, context) => {
  if (context && context.logger && typeof context.logger.info === 'function') {
    context.logger.info(`[END] ${step}`);
  }
}; 