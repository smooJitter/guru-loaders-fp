// =============================
// 3. Async Control Utilities
// =============================

export const debounceAsync = (fn, ms) => {
  let timeout;
  return async (...args) => {
    clearTimeout(timeout);
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        resolve(await fn(...args));
      }, ms);
    });
  };
};

export const throttleAsync = (fn, ms) => {
  let last = 0;
  return async (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      return fn(...args);
    }
  };
};

export const retryAsync = (fn, { max = 3, delay = 1000 } = {}) => 
  async (...args) => {
    let lastError;
    for (let i = 0; i < max; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (i < max - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    }
    throw lastError;
  };

export const cacheAsync = (fn, { ttl = 60000 } = {}) => {
  const cache = new Map();
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }
    const value = await fn(...args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
};
