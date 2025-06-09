import chokidar from 'chokidar';
import * as R from 'ramda';

export function setupFeatureHotReload(patterns, projectRoot, onReload, reloadCallback, loaderOptions, logger) {
  const watcher = chokidar.watch(patterns, {
    cwd: projectRoot,
    ignoreInitial: true
  });

  watcher.on('all', async (event, file) => {
    if (!file.endsWith('index.js')) return;
    logger.info(`featureLoader: Detected ${event} on ${file}. Reloading features…`);
    try {
      const result = await loaderOptions.featureLoader(loaderOptions);
      if (!R.isNil(onReload)) onReload({ errors: result.errors });
      if (!R.isNil(reloadCallback)) reloadCallback({ errors: result.errors });
    } catch (reloadErr) {
      logger.error('featureLoader: Error during hot-reload:', reloadErr);
    }
  });
  return watcher;
} 