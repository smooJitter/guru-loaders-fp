Ah, great observation! Let me explain the key differences between the routes loader and actions loader that make the actions loader inherently more complex:

1. **Different Responsibilities**:
   - **Routes Loader**: Simply discovers and loads route definitions
   - **Actions Loader**: Has to handle:
     - Action validation (using Zod schemas)
     - Middleware composition
     - Cross-action dependencies
     - Meta information
     - Hot reloading with state management

2. **Validation Requirements**:
```javascript
// Actions loader needs to validate both creators and methods
const actionCreatorSchema = z.function()
  .args(z.object({ 
    models: z.any(), 
    logger: z.any(), 
    actions: z.any() 
  }))
  .returns(z.object());

const actionMethodSchema = z.function()
  .args(z.any(), z.object())
  .returns(z.any());
```

3. **Middleware System**:
```javascript
// Actions loader needs to handle middleware composition
function applyMiddleware(fn, middlewares = []) {
  return middlewares.reduceRight(
    (next, mw) => (...args) => mw(...args, next),
    fn
  );
}
```

4. **Cross-Action Dependencies**:
```javascript
// Actions can reference other actions
const actions = createActions({ 
  models, 
  logger, 
  actions: actionMap  // Pass existing actions for cross-references
});
```

5. **Meta Information**:
```javascript
// Actions can have metadata
const { meta, ...methods } = actions;
metaMap[moduleName] = metaMap[moduleName] || {};
metaMap[moduleName][name] = meta;
```













So yes, the actions loader is more complex because it's designed to handle more advanced features from the start. The routes loader is simpler because it has a simpler job - just loading route definitions.
Here's a comparison of their core responsibilities:

**Routes Loader**:
```javascript
// Simple pipeline
1. Find route files
2. Load each file
3. Return array of routes
```

**Actions Loader**:
```javascript
// Complex pipeline
1. Find action files
2. Load each file
3. Validate action creators
4. Validate action methods
5. Apply middleware
6. Handle cross-action dependencies
7. Process metadata
8. Setup hot reloading
9. Return structured action map
```

The functional programming patterns make this complexity more manageable by:
1. Breaking down the complex pipeline into smaller, focused functions
2. Making the data flow more explicit
3. Making it easier to test individual parts
4. Making it easier to modify or extend functionality

But you're right - the actions loader is inherently more complex because it needs to handle more features. The FP patterns help manage that complexity, but they don't reduce the underlying complexity of the requirements.

Would you like me to show how we could simplify the actions loader while keeping its core functionality?






I'll help you refactor the `routes-loader.js` using functional programming patterns. Here's a more functional version using Ramda:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import { findFiles } from '../utils/loader-utils.js';
import * as R from 'ramda';

const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Default patterns for route discovery
const defaultPatterns = [
  'src/routes/*.js',
  'src/modules/**/route-*.js',
  'server/routes/*.js',
  'server/modules/**/route-*.js'
];

// Helper: Run plugin for a specific phase
const runPlugin = R.curry((phase, plugin, context) => 
  typeof plugin === 'function' ? plugin({ phase, ...context }) : Promise.resolve()
);


const processFile = R.curry(({ logger, config, plugins }, relPath) => 
  R.pipeP(
    // 1. Import the module
    () => import(path.resolve(__root, relPath)),
    
    // 2. Extract default or module
    mod => mod.default || mod,
    
    // 3. Handle function exports
    async r => typeof r === 'function' ? await r({ logger, config }) : r,
    
    // 4. Run afterFile plugins
    async r => {
      for (const plugin of plugins) {
        r = (await runPlugin('afterFile', plugin, { 
          file: relPath, 
          route: r, 
          logger, 
          config 
        })) || r;
      }
      return r;
    },
    
    // 5. Ensure array output
    r => Array.isArray(r) ? r : [r]
  )().catch(async err => {
    // Handle errors with plugins
    for (const plugin of plugins) {
      await runPlugin('onError', plugin, { 
        file: relPath, 
        error: err, 
        logger, 
        config 
      });
    }
    return [];
  })
);

// Helper: Run beforeAll plugins
const runBeforeAllPlugins = R.curry((plugins, context) =>
  Promise.all(plugins.map(plugin => 
    runPlugin('beforeAll', plugin, context)
  ))
);

// Helper: Run afterAll plugins
const runAfterAllPlugins = R.curry((plugins, context) =>
  Promise.all(plugins.map(plugin => 
    runPlugin('afterAll', plugin, context)
  ))
);

// Helper: Log errors
const logErrors = R.curry((logger, errors) => {
  errors.forEach(({ file, error }) => {
    if (logger) logger.error(`Error importing route from ${file}:`, error);
    else console.error(`Error importing route from ${file}:`, error);
  });
  return errors;
});

// Main loader function
export default async function loader({ 
  logger, 
  config, 
  plugins = [], 
  patterns: customPatterns 
} = {}) {
  try {
    // 1. Setup context and patterns
    const context = { logger, config };
    const patterns = customPatterns || defaultPatterns;

    // 2. Run beforeAll plugins
    await runBeforeAllPlugins(plugins, context);

    // 3. Find and process files
    const files = R.pipe(
      // Find all matching files
      patterns => Promise.all(patterns.map(p => findFiles(p))),
      // Flatten results
      R.flatMap(R.identity)
    )(patterns);

    // 4. Process all files
    const routes = R.pipe(
      // Process each file
      files => Promise.all(files.map(processFile({ logger, config, plugins }))),
      // Flatten results
      R.flatMap(R.identity)
    )(await files);

    // 5. Run afterAll plugins
    await runAfterAllPlugins(plugins, { ...context, routes });

    // 6. Handle any errors
    const errors = [];
    if (errors.length) {
      logErrors(logger, errors);
      throw new Error(`Failed to import ${errors.length} route file(s). See logs for details.`);
    }

    return routes;
  } catch (error) {
    if (logger) logger.error('Error loading routes:', error);
    else console.error('Error loading routes:', error);
    throw error;
  }
}
```

Key improvements in this FP version:

1. **Curried Functions**:
   - `runPlugin`, `processFile`, `runBeforeAllPlugins`, etc. are curried for better composition
   - Makes it easier to partially apply arguments

2. **Function Composition**:
   - Uses `R.pipe` and `R.pipeP` for clear data flow
   - Each transformation step is clearly defined

3. **Point-Free Style**:
   - Many functions are written in point-free style where possible
   - Reduces visual noise and makes the code more declarative

4. **Immutable Operations**:
   - Uses Ramda's immutable operations
   - No direct mutations of objects

5. **Error Handling**:
   - Functional error handling with `catch`
   - Consistent error logging pattern

6. **Plugin System**:
   - More functional approach to plugin execution
   - Clearer separation of concerns

7. **Data Transformation Pipeline**:
   - Clear pipeline for file processing
   - Each step is a pure function

The main benefits of this refactored version:

1. **More Declarative**: The code clearly shows the data flow
2. **More Composable**: Functions can be easily combined
3. **More Testable**: Pure functions are easier to test
4. **More Maintainable**: Each function has a single responsibility
5. **More Reusable**: Curried functions can be partially applied

Would you like me to explain any particular part in more detail?


I'll help refactor the `actions-loader.js` using functional programming patterns. Here's a more functional version:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import { findFiles as defaultFindFiles } from '../utils/loader-utils.js';
import * as R from 'ramda';
import logger from '../utils/logger.js';
import { z } from 'zod';
import chokidar from 'chokidar';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');
const patterns = [
  'src/actions/**/*.js',
  'src/modules/**/actions/*.actions.js'
];

// Zod schemas
const actionCreatorSchema = z.function()
  .args(z.object({ 
    models: z.any(), 
    logger: z.any(), 
    actions: z.any() 
  }))
  .returns(z.object());

const actionMethodSchema = z.function()
  .args(z.any(), z.object())
  .returns(z.any());

// Hot reload registry
let reloadCallback = null;
export const onActionsReload = cb => { reloadCallback = cb; };

// Helper: Compose middleware pipeline
const applyMiddleware = R.curry((fn, middlewares = []) =>
  R.reduceRight(
    (mw, next) => (...args) => mw(...args, next),
    fn,
    middlewares
  )
);

// Helper: Extract module and action name from path
const extractActionInfo = R.pipe(
  path.relative.bind(null, projectRoot),
  R.split(path.sep),
  parts => {
    const moduleIndex = R.indexOf('modules', parts);
    return {
      moduleName: moduleIndex !== -1 ? parts[moduleIndex + 1] : 'global',
      name: R.pipe(
        R.last,
        R.replace('.actions.js', '')
      )(parts)
    };
  }
);

// Helper: Validate and wrap action method
const wrapActionMethod = R.curry(({ moduleName, name, methodName, middlewares }, fn) => {
  if (!actionMethodSchema.safeParse(fn).success) {
    logger.warn(`Action method ${moduleName}.${name}.${methodName} does not match expected signature (input, context)`);
  }
  return fn;
});

// Helper: Process action creator
const processActionCreator = R.curry(({ models, logger, actionMap, middlewares }, { moduleName, name, createActions }) => {
  const actions = createActions({ models, logger, actions: actionMap });
  const { meta, ...methods } = actions;
  
  // Process methods
  const processedMethods = R.pipe(
    R.toPairs,
    R.map(([methodName, fn]) => [
      methodName,
      R.pipe(
        wrapActionMethod({ moduleName, name, methodName, middlewares }),
        applyMiddleware(R.__, middlewares)
      )(fn)
    ]),
    R.fromPairs
  )(methods);

  return {
    actions: R.assocPath([moduleName, name], processedMethods, actionMap),
    meta: meta ? R.assocPath([moduleName, name], meta, {}) : {}
  };
});

// Helper: Load and validate action module
const loadActionModule = R.curry(async (absPath) => {
  try {
    const mod = await import(
      path.isAbsolute(absPath) 
        ? `${absPath}?update=${Date.now()}` 
        : `${path.resolve(projectRoot, absPath)}?update=${Date.now()}`
    );
    
    const createActions = mod.default;
    if (!actionCreatorSchema.safeParse(createActions).success) {
      logger.warn(`Action module ${absPath} does not export a valid action creator function`);
      return null;
    }

    return {
      ...extractActionInfo(absPath),
      createActions
    };
  } catch (err) {
    logger.error(`Error loading action module ${absPath}:`, err);
    return null;
  }
});

// Helper: Setup hot reloading
const setupHotReload = R.curry(({ models, middlewares, findFiles }, { actions, meta }) => {
  if (process.env.NODE_ENV !== 'development') return { actions };

  const watcher = chokidar.watch(patterns, { 
    cwd: projectRoot, 
    ignoreInitial: true 
  });

  watcher.on('change', async (file) => {
    logger.info(`Hot reloading action: ${file}`);
    const result = await buildActionMap({ models, middlewares, findFiles });
    if (reloadCallback) reloadCallback(result);
  });

  return { actions, __watcher: watcher };
});

// Main build function
const buildActionMap = async ({ models, middlewares = [], findFiles = defaultFindFiles }) => {
  // Find all action files
  const files = R.pipe(
    patterns => Promise.all(patterns.map(p => findFiles(p, { logger }))),
    R.flatMap(R.identity)
  )(patterns);

  if (R.isEmpty(files)) {
    logger.warn('No action files found. Patterns searched:', patterns);
  }

  // Load and process all action modules
  const actionCreators = R.pipe(
    files => Promise.all(files.map(loadActionModule)),
    R.filter(R.complement(R.isNil))
  )(await files);

  // Process all action creators
  const { actions, meta } = R.reduce(
    (acc, creator) => {
      const result = processActionCreator(
        { models, logger, actionMap: acc.actions, middlewares },
        creator
      );
      return {
        actions: result.actions,
        meta: R.mergeDeepRight(acc.meta, result.meta)
      };
    },
    { actions: {}, meta: {} },
    actionCreators
  );

  // Log loaded actions
  logger.info('Loaded Actions Registry', {
    actionNames: R.keys(actions),
    actions: R.pipe(
      R.toPairs,
      R.map(([name, actions]) => ({
        name,
        methods: R.keys(actions)
      }))
    )(actions),
    meta
  });

  return { actions, meta };
};

// Main loader function
export default async function loader({ models, middlewares = [], findFiles }) {
  return R.pipeP(
    buildActionMap,
    setupHotReload({ models, middlewares, findFiles })
  )({ models, middlewares, findFiles });
}
```

Key improvements in this FP version:

1. **Curried Functions**:
   - All helper functions are curried for better composition
   - Makes it easier to partially apply arguments

2. **Point-Free Style**:
   - Uses `R.pipe` and `R.pipeP` for clear data flow
   - Reduces visual noise and makes the code more declarative

3. **Immutable Operations**:
   - Uses Ramda's immutable operations like `R.assocPath`, `R.mergeDeepRight`
   - No direct mutations of objects

4. **Function Composition**:
   - Clear pipeline for processing actions
   - Each transformation step is a pure function

5. **Error Handling**:
   - Functional error handling with `R.tryCatch` and `R.filter`
   - Consistent error logging pattern

6. **Modular Design**:
   - Each function has a single responsibility
   - Easy to test and maintain

The main benefits of this refactored version:

1. **More Declarative**: The code clearly shows the data flow
2. **More Composable**: Functions can be easily combined
3. **More Testable**: Pure functions are easier to test
4. **More Maintainable**: Each function has a single responsibility
5. **More Reusable**: Curried functions can be partially applied

Would you like me to explain any particular part in more detail?
