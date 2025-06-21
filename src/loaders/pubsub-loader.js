import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { findFiles, importAndApplyAll } from '../utils/file-utils-new.js';
import { buildPubsubRegistryWithWarning } from '../core/loader-core/lib/registry-builders.js';

const PUBSUB_PATTERNS = ['**/*.pubsub.js', '**/pubsub/**/*.index.js'];

const validate = m => !!m && typeof m.name === 'string';

export function createPubsubLoader(options = {}) {
  return createAsyncLoader('pubsubs', {
    patterns: PUBSUB_PATTERNS,
    findFiles,
    importAndApplyAll,
    registryBuilder: buildPubsubRegistryWithWarning,
    validate,
    contextKey: 'pubsubs',
    ...options
  });
}

export default createPubsubLoader(); 