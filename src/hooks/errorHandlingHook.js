export const errorHandlingHook = async (fn, context, ...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    context.logger.error('Error occurred:', error);
    throw error;
  }
}; 