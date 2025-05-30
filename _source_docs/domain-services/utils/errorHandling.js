// Higher-order function for error handling
export const withErrorHandling = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    // Optionally log or transform error here
    throw err;
  }
};

// Example: withLogging HOF
export const withLogging = (fn) => async (...args) => {
  console.log(`Calling ${fn.name} with`, args);
  return fn(...args);
}; 