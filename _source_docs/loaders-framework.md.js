// core/pipeline/create-loader.js
import { pipeAsync } from '../../utils/fp';
import { findFiles } from '../../utils/file';
import { validate } from '../../utils/validation';

// Single loader factory that handles all types
export const createLoader = R.curry((type) => async (context) => {
  const { logger, config } = context;

  const pipeline = [
    // Find files
    () => findFiles(`src/modules/**/*.${type}.js`),
    
    // Load modules
    files => Promise.all(files.map(file => import(file))),
    
    // Validate based on type
    modules => modules.map(module => validate(type, module)),
    
    // Create registry
    modules => modules.reduce((acc, { name, ...rest }) => ({
      ...acc,
      [name]: rest
    }), {})
  ];

  return pipeAsync(pipeline)();
});

// core/index.js
import { createLoader } from './pipeline';

export const createLoader = async ({ logger, config, plugins = [] } = {}) => {
  // Create context
  const context = createContext({ logger, config });

  // Define loading pipeline
  const pipeline = [
    // Core services
    async (ctx) => ({
      ...ctx,
      env: await createLoader('env')(ctx),
      db: await createLoader('db')(ctx)
    }),
    
    // Models & Types
    async (ctx) => ({
      ...ctx,
      models: await createLoader('model')(ctx),
      types: await createLoader('tc')(ctx)
    }),
    
    // Business Logic
    async (ctx) => ({
      ...ctx,
      actions: await createLoader('actions')(ctx),
      methods: await createLoader('methods')(ctx)
    }),
    
    // GraphQL
    async (ctx) => ({
      ...ctx,
      json: await createLoader('json')(ctx),
      sdl: await createLoader('sdl')(ctx),
      resolvers: await createLoader('resolvers')(ctx)
    })
  ];

  return pipeAsync(pipeline)(context);
};

