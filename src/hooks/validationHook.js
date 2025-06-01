export const validationHook = (module, schema) => {
  const isValid = Object.keys(schema).every(key => typeof module[key] === schema[key]);
  if (!isValid) {
    throw new Error('Module validation failed');
  }
  return module;
}; 