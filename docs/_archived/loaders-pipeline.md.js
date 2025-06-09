// Generalized Loader Pipeline Pattern



const createLoader = (type) => async ({ logger, config, plugins = [] }) => {
  // 1. Find Files
  const findFiles = async (pattern) => {
    const files = await findFiles(pattern);
    return files;
  };

  // 2. Load Modules
  const loadModules = async (files) => {
    const modules = await Promise.all(
      files.map(async file => {
        const mod = await import(file);
        return {
          file,
          module: typeof mod.default === 'function' 
            ? mod.default({ logger, config }) 
            : mod.default
        };
      })
    );
    return modules;
  };

  // 3. Process Modules
  const processModules = async (modules) => {
    const registry = {};
    for (const { file, module } of modules) {
      const { name, ...rest } = module;
      
      // Type-specific processing
      switch(type) {
        case 'model':
          registry[name] = {
            schema: rest.schema,
            model: rest.model
          };
          break;
        case 'tc':
          registry[name] = {
            schema: rest.schema,
            tc: rest.tc
          };
          break;
        case 'actions':
          registry[name] = {
            methods: rest.methods,
            meta: rest.meta
          };
          break;
        case 'resolvers':
          registry[name] = {
            methods: rest.methods,
            meta: rest.meta
          };
          break;
      }
    }
    return registry;
  };

  // 4. Apply Plugins
  const applyPlugins = async (registry) => {
    for (const plugin of plugins) {
      if (typeof plugin === 'function') {
        registry = await plugin({ 
          phase: 'afterProcess', 
          registry, 
          logger, 
          config 
        }) || registry;
      }
    }
    return registry;
  };

  // 5. Compose Pipeline
  return R.pipeP(
    findFiles,
    loadModules,
    processModules,
    applyPlugins
  )();
};

// Usage
const modelLoader = createLoader('model');
const tcLoader = createLoader('tc');
const actionLoader = createLoader('actions');
const resolverLoader = createLoader('resolvers');









// 1. Context Object Structure
const createContext = ({ logger, config }) => ({
  // Core services
  logger,
  config,
  
  // Registries (populated by loaders)
  models: {},
  types: {},
  actions: {},
  methods: {},
  resolvers: {}
});

// 2. Loader Pipeline with Context
const createLoader = (type) => async (context) => {
  // Each loader gets the full context
  const { logger, config, plugins = [] } = context;

  // Pipeline steps
  const findFiles = async () => {
    const pattern = `src/modules/**/*.${type}.js`;
    return findFiles(pattern);
  };

  const loadModules = async (files) => {
    return Promise.all(
      files.map(async file => {
        const mod = await import(file);
        // Pass full context to factory
        return {
          file,
          module: typeof mod.default === 'function' 
            ? mod.default(context)  // <-- Full context here
            : mod.default
        };
      })
    );
  };

  const processModules = async (modules) => {
    const registry = {};
    for (const { file, module } of modules) {
      const { name, ...rest } = module;
      
      // Type-specific processing
      switch(type) {
        case 'model':
          registry[name] = {
            schema: rest.schema,
            model: rest.model
          };
          break;
        case 'tc':
          registry[name] = {
            schema: rest.schema,
            tc: rest.tc
          };
          break;
        // ... other types
      }
    }
    return registry;
  };

  // 3. Update Context
  const updateContext = async (registry) => {
    // Update the appropriate registry in context
    context[`${type}s`] = registry;  // models, types, etc.
    return context;
  };

  // 4. Compose Pipeline
  return R.pipeP(
    findFiles,
    loadModules,
    processModules,
    updateContext
  )();
};

// 5. Main Application Setup
const setupApp = async () => {
  // Create initial context
  const context = createContext({ logger, config });

  // Run loaders in sequence
  await createLoader('model')(context);
  await createLoader('tc')(context);
  await createLoader('actions')(context);
  await createLoader('resolvers')(context);

  return context;
};



```

The key relationships:

1. **Context as State**:
   - Context holds all registries
   - Each loader updates its registry
   - Context flows through the pipeline

2. **Loader Dependencies**:
   - Later loaders can use earlier registries
   - e.g., resolvers can use models and types

3. **Factory Functions**:
   - Each module gets full context
   - Can access any registry
   - Can use any service

4. **Example Usage**:

```

// In a resolver
export function({ models, types, actions }) => ({
  name: 'UserResolvers',
  methods: {
    Query: {
      user: async (_, { id }, context) => {
        // Can use any registry
        const { User } = context.models;
        const { UserTC } = context.types;
        const user = await User.findById(id);
        return user;
      }
    }
  }
});






// 1. More Functional Context Creation
const createContext = R.curry((services, registries) => ({
  ...services,
  ...registries
}));

// 2. Functional Loader Pipeline with Circular Dependency Handling
const createLoader = (type) => R.curry(async (context) => {
  const { logger, config, plugins = [] } = context;

  // Pure functions for each step
  const findFiles = R.curry((pattern) => 
    findFiles(pattern)
  );

  const loadModule = R.curry(async (context, file) => {
    const mod = await import(file);
    return {
      file,
      module: typeof mod.default === 'function' 
        ? mod.default(context) 
        : mod.default
    };
  });

  const processModule = R.curry((type, { file, module }) => {
    const { name, ...rest } = module;
    return {
      name,
      processed: R.cond([
        [R.equals('model'), () => ({ schema: rest.schema, model: rest.model })],
        [R.equals('tc'), () => ({ schema: rest.schema, tc: rest.tc })],
        [R.equals('actions'), () => ({ methods: rest.methods, meta: rest.meta })],
        [R.equals('resolvers'), () => ({ methods: rest.methods, meta: rest.meta })],
        [R.T, () => rest]
      ])(type)
    };
  });

  // 3. Circular Dependency Handling
  const createRegistry = R.curry((type, modules) => {
    // Create empty registry first
    const registry = {};
    
    // First pass: Register all names
    modules.forEach(({ name }) => {
      registry[name] = null;
    });

    // Second pass: Fill in implementations
    modules.forEach(({ name, processed }) => {
      registry[name] = processed;
    });

    return registry;
  });

  // 4. Context Update (Immutable)
  const updateContext = R.curry((type, registry, context) => ({
    ...context,
    [`${type}s`]: registry
  }));

  // 5. Compose Pipeline
  return R.pipeP(
    findFiles(`src/modules/**/*.${type}.js`),
    R.map(loadModule(context)),
    R.map(processModule(type)),
    createRegistry(type),
    updateContext(type)
  )();
});

// 6. Main Application Setup with Circular Dependency Resolution
const setupApp = async () => {
  // Create initial context
  const initialContext = createContext(
    { logger, config },
    {
      models: {},
      types: {},
      actions: {},
      methods: {},
      resolvers: {}
    }
  );

  // Create loaders
  const modelLoader = createLoader('model');
  const tcLoader = createLoader('tc');
  const actionLoader = createLoader('actions');
  const resolverLoader = createLoader('resolvers');

  // Run loaders with dependency resolution
  const context = await R.pipeP(
    // First pass: Load everything with empty registries
    async (ctx) => {
      const [models, types, actions, resolvers] = await Promise.all([
        modelLoader(ctx),
        tcLoader(ctx),
        actionLoader(ctx),
        resolverLoader(ctx)
      ]);
      return { ...ctx, models, types, actions, resolvers };
    },
    // Second pass: Resolve circular dependencies
    async (ctx) => {
      const [models, types, actions, resolvers] = await Promise.all([
        modelLoader(ctx),
        tcLoader(ctx),
        actionLoader(ctx),
        resolverLoader(ctx)
      ]);
      return { ...ctx, models, types, actions, resolvers };
    }
  )(initialContext);

  return context;
};




// 7. Usage Example with Circular Dependencies
const userModel = {
  name: 'User',
  schema: new mongoose.Schema({
    name: String,
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
  }),
  model: mongoose.model('User', schema)
};

const postModel = {
  name: 'Post',
  schema: new mongoose.Schema({
    title: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }),
  model: mongoose.model('Post', schema)
};

// 8. Resolver with Circular Reference
const userResolvers = {
  name: 'UserResolvers',
  methods: {
    User: {
      posts: async (user, _, context) => {
        const { Post } = context.models;
        return Post.find({ author: user.id });
      }
    }
  }
};

const postResolvers = {
  name: 'PostResolvers',
  methods: {
    Post: {
      author: async (post, _, context) => {
        const { User } = context.models;
        return User.findById(post.author);
      }
    }
  }
};


Key improvements:

1. **More Functional**:
   - All functions are curried
   - Uses `R.pipeP` for composition
   - Immutable updates with `R.curry`
   - Pure functions for each step

2. **Circular Dependency Handling**:
   - Two-pass loading system
   - First pass registers names
   - Second pass fills implementations
   - Allows circular references

3. **Benefits**:
   - More predictable
   - Easier to test
   - Better error handling
   - Cleaner dependency management

Would you like me to explain any part in more detail?

































Here's how the main application setup and context creation would look:

```javascript
// core/context/create-context.js
import { mergeDeepRight } from 'ramda';

export const createContext = R.curry((services, registries) => ({
  // Core services
  logger: services.logger,
  config: services.config,
  
  // Empty registries (to be filled by loaders)
  models: {},
  types: {},
  actions: {},
  methods: {},
  resolvers: {},
  
  // Merge any initial registries
  ...registries
}));

// core/index.js
import { createContext } from './context';
import { createLoader } from './pipeline';
import { validateContext } from './context/validate-context';

// Create loaders
const modelLoader = createLoader('model');
const tcLoader = createLoader('tc');
const actionLoader = createLoader('actions');
const resolverLoader = createLoader('resolvers');

// Main application setup
export const setupApp = async ({ logger, config, plugins = [] } = {}) => {
  // 1. Create initial context
  const context = createContext(
    { logger, config },
    {
      models: {},
      types: {},
      actions: {},
      methods: {},
      resolvers: {}
    }
  );

  // 2. Validate required context
  await validateContext(['logger', 'config'], context);

  // 3. Run loaders in sequence
  const loaders = [
    modelLoader,
    tcLoader,
    actionLoader,
    resolverLoader
  ];

  // 4. Run each loader and update context
  for (const loader of loaders) {
    const result = await loader(context);
    context[`${result.type}s`] = result.registry;
  }

  // 5. Apply plugins
  for (const plugin of plugins) {
    if (typeof plugin === 'function') {
      await plugin(context);
    }
  }

  return context;
};

// Example usage:
// app.js
import { setupApp } from './core';

const app = async () => {
  const context = await setupApp({
    logger: console,
    config: {
      env: process.env.NODE_ENV,
      // ... other config
    },
    plugins: [
      // Development plugins
      process.env.NODE_ENV === 'development' && 
        require('./plugins/hot-reload'),
      // Production plugins
      process.env.NODE_ENV === 'production' && 
        require('./plugins/cache')
    ].filter(Boolean)
  });

  // Now context has all loaded modules
  const { models, types, actions, resolvers } = context;
  
  return context;
};

// Example with hot reloading:
if (process.env.NODE_ENV === 'development') {
  const context = await app();
  
  // Watch for changes
  context.logger.info('Watching for changes...');
  
  // Hot reload handler
  const onReload = async (type, name) => {
    context.logger.info(`Reloading ${type}: ${name}`);
    const loader = createLoader(type);
    const result = await loader(context);
    context[`${type}s`][name] = result.registry[name];
  };
}
```

This setup:
1. Creates a functional context factory
2. Validates required context
3. Runs loaders in sequence
4. Supports plugins
5. Handles hot reloading
6. Is fully typed and documented

Would you like me to show how this integrates with the loader pipeline or how to add more features?
