export const importAndApplyAllFeatures = async (files, context) => {
  const manifests = [];
  for (const file of files) {
    const mod = (await import(file)).default ?? (await import(file));
    if (typeof mod === 'function') {
      const manifest = await mod(context);
      if (manifest) manifests.push(manifest);
    }
  }
  return manifests;
}; 