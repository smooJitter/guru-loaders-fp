export const lifecycleHook = async (lifecycleMethods, context) => {
  for (const method of lifecycleMethods) {
    if (typeof method === 'function') {
      await method(context);
    }
  }
  return context;
}; 