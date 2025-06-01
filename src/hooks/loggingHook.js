export const loggingHook = (context, message) => {
  context.logger.info(message);
  return context;
}; 