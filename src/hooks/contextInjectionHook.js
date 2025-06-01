export const contextInjectionHook = (module, context) => {
  return {
    ...module,
    context
  };
}; 