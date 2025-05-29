


// core/index.js
import { pipeAsync } from '../utils/fp';
import { createContext } from './context';
import { createLoader } from './pipeline';

// Loader imports
import { envLoader } from './loaders/env';
import { dbLoader } from './loaders/db';
import { modelLoader } from './loaders/model';
import { tcLoader } from './loaders/tc';
import { actionLoader } from './loaders/actions';
import { resolverLoader } from './loaders/resolvers';
import { jsonLoader } from './loaders/json';
import { sdlLoader } from './loaders/sdl';
import { middlewareLoader } from './loaders/middleware';
import { routesLoader } from './loaders/routes';

// Create loaders with context
const createLoaders = R.curry((context) => ({
  env: () => envLoader(context),
  db: () => dbLoader(context),
  model: () => modelLoader(context),
  tc: () => tcLoader(context),
  action: () => actionLoader(context),
  resolver: () => resolverLoader(context),
  json: () => jsonLoader(context),
  sdl: () => sdlLoader(context),
  middleware: () => middlewareLoader(context),
  routes: () => routesLoader(context)
}));

// Main loader function
export const createLoader = async ({ logger, config, plugins = [], onReload } = {}) => {
// 1. Create initial context
  const context = createContext({ logger, config });

// 2. Create loaders
  const loaders = createLoaders(context);

// 3. Define loading pipeline
  const pipeline = [
    // Core services
    async (ctx) => ({
      ...ctx,
      env: await loaders.env(),
      db: await loaders.db()
    }),
    
    // Models & Types
    async (ctx) => ({
      ...ctx,
      models: await loaders.model(),
      types: await loaders.tc()
    }),
    
    // Business Logic
    async (ctx) => ({
      ...ctx,
      actions: await loaders.action(),
      methods: await loaders.method()
    }),
    
    // GraphQL
    async (ctx) => {
      const json = await loaders.json();
      const sdl = await loaders.sdl();
      const resolvers = await loaders.resolver();
      return {
        ...ctx,
        json,
        sdl,
        resolvers
      };
    },
    
    // Express
    async (ctx) => ({
      ...ctx,
      middleware: await loaders.middleware(),
      routes: await loaders.routes()
    })
  ];

// 4. Run pipeline with error handling
  try {
    // Run plugins: beforeAll
    await Promise.all(plugins.map(p => p({ phase: 'beforeAll', context })));

    // Run pipeline
    const result = await pipeAsync(pipeline)(context);

    // Run plugins: afterAll
    await Promise.all(plugins.map(p => p({ phase: 'afterAll', context: result })));

// 5. Create request context factory
    const createRequestContext = ({ req }) => ({
      ...result,
      user: req?.user
    });

    return {
      ...result,
      createContext: createRequestContext
    };

  } catch (error) {
    // Run plugins: onError
    await Promise.all(plugins.map(p => p({ phase: 'onError', error, context })));
    
    if (logger) logger.error('Error in createLoader:', error);
    throw error;
  }
};

// Hot reload support
export const setupHotReload = (context, onReload) => {
  if (process.env.NODE_ENV === 'development' && onReload) {
    const watchers = Object.entries(createLoaders(context))
      .map(([type, loader]) => 
        watchFiles(`src/modules/**/*.${type}.js`, async () => {
          const result = await loader();
          onReload({ type, result });
        })
      );
    
    return () => watchers.forEach(w => w.close());
  }
  return () => {};
};
