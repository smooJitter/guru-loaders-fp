import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { findFiles, importAndApplyAll } from '../utils/file-utils-new.js';
import { buildSdlRegistryWithWarning } from '../core/loader-core/lib/registry-builders.js';

const SDL_PATTERNS = ['**/*.sdl.js', '**/sdl/**/*.index.js'];

const validate = m => !!m && typeof m.name === 'string' && typeof m.sdl === 'string';

export function createSdlLoader(options = {}) {
  return createAsyncLoader('sdls', {
    patterns: SDL_PATTERNS,
    findFiles,
    importAndApplyAll,
    registryBuilder: buildSdlRegistryWithWarning,
    validate,
    contextKey: 'sdls',
    ...options
  });
}

export default createSdlLoader(); 