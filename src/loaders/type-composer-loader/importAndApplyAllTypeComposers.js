export const importAndApplyAllTypeComposers = async (files, context) => {
  const results = [];
  for (const file of files) {
    const mod = (await import(file)).default ?? (await import(file));
    if (typeof mod === 'function') {
      await mod(context);
      results.push(mod);
    }
  }
  return results;
}; 