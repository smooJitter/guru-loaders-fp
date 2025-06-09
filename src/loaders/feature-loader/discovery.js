import path from 'path';
import * as R from 'ramda';
// import * as RA from 'ramda-adjunct';

export async function findFeatureFiles(patterns, findFiles, logger) {
  if (R.isNil(patterns) || !Array.isArray(patterns)) throw new TypeError('Patterns must be a non-empty array');
  const filesArrays = await Promise.all(
    R.map((pattern) => findFiles(pattern, { logger }), patterns)
  );
  const files = R.flatten(filesArrays);
  if (R.isEmpty(files)) {
    logger.warn('featureLoader: No feature index files found. Patterns:', patterns);
  } else {
    logger.info('featureLoader: Found feature files:', files);
  }
  return files;
}

export async function aggregateFeatureArtifacts(files, discoverArtifacts, context, logger) {
  const errors = [];
  const featureManifests = [];
  await Promise.all(
    R.map(async (relPath) => {
      const featureDir = path.dirname(relPath);
      const featureName = path.basename(featureDir);
      try {
        logger.info(`[START] feature:${featureName}`);
        const manifest = await discoverArtifacts(featureDir);
        if (manifest && typeof manifest === 'object') {
          featureManifests.push(manifest);
        }
        logger.info(`[END] feature:${featureName}`);
      } catch (featErr) {
        logger.error(`featureLoader: Error registering feature at ${relPath}:`, featErr);
        errors.push({ file: relPath, error: featErr });
      }
    }, files)
  );
  return { featureManifests, errors };
} 