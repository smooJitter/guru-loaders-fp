// Utility to standardize logger selection and prefixing for loaders
export function getLoaderLogger(ctx, options = {}, prefix = 'loader') {
  const logger =
    ctx.logger ||
    (ctx.services && ctx.services.logger) ||
    options.logger ||
    console;
  return {
    info: (...args) => logger.info && logger.info(`[${prefix}]`, ...args),
    warn: (...args) => logger.warn && logger.warn(`[${prefix}]`, ...args),
    error: (...args) => logger.error && logger.error(`[${prefix}]`, ...args),
    debug: (...args) => logger.debug && logger.debug(`[${prefix}]`, ...args),
  };
} 