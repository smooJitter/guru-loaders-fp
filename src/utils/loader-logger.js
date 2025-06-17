// Utility to standardize logger selection and prefixing for loaders
export const getLoaderLogger = () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
}); 