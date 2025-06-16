import { createLoader } from '../../utils/loader-utils.js';
import { extractHandlers } from './extractHandlers.js';
import { validateHandlerModule } from './validateHandlerModule.js';

const DEFAULT_PATTERNS = ['**/*.handlers.js'];
const DEFAULT_TRANSFORM = extractHandlers;
const DEFAULT_VALIDATE = validateHandlerModule;

export const createHandlerLoader = (options = {}) =>
  createLoader('handlers', {
    patterns: DEFAULT_PATTERNS,
    transform: DEFAULT_TRANSFORM,
    validate: DEFAULT_VALIDATE,
    ...options
  });

export default createHandlerLoader(); 