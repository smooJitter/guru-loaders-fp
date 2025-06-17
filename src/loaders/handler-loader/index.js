import { createLoader } from '../../utils/loader-utils.js';
import { extractHandlers } from './lib/extractHandlers.js';
import { validateHandlerModule } from './lib/validateHandlerModule.js';

const DEFAULT_PATTERNS = ['**/*.handlers.js'];
const DEFAULT_TRANSFORM = extractHandlers;
const DEFAULT_VALIDATE = validateHandlerModule;

export const createHandlerLoader = (options = {}) =>
  createLoader('handlers', {
    patterns: DEFAULT_PATTERNS,
    transform: (modules, ctx) => extractHandlers(modules, ctx),
    validate: DEFAULT_VALIDATE,
    ...options
  });

export const handlerLoader = async (ctx = {}) => {
  const options = ctx.options || {};
  const loader = createHandlerLoader({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });
  const { context } = await loader(ctx);
  // Ensure handlers is set on context
  if (!context.handlers || typeof context.handlers !== 'object') {
    context.handlers = {};
  }
  return { handlers: context.handlers };
};

export default handlerLoader; 