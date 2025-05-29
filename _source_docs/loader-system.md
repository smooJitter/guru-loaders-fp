Here's how I would document the loader system:


# Loader System Documentation

## Overview
A functional, context-aware loader system that handles multiple types of modules (models, types, actions, resolvers) with circular dependency resolution.

## Core Concepts

### 1. Context Object
    ```javascript
    {
    // Core services
    logger: Logger,
    config: Config,
    
    // Registries
    models: { [name: string]: Model },
    types: { [name: string]: TypeComposer },
    actions: { [name: string]: Actions },
    methods: { [name: string]: Methods },
    resolvers: { [name: string]: Resolvers }
    }
    ```

### 2. Loader Types
- `model`: Mongoose database models
- `tc`: GraphQL type composers
- `actions`: Business logic operations
- `methods`: Utility functions
- `resolvers`: GraphQL resolvers

### 3. Module Patterns

#### Model Pattern
```javascript
// user.model.js
export default ({ logger, config }) => ({
  name: 'User',
  schema: new mongoose.Schema({ ... }),
  model: mongoose.model('User', schema)
});
```

#### Type Composer Pattern
```javascript
// user.tc.js
export default ({ builder, logger }) => ({
  name: 'User',
  schema: builder.objectType('User', { ... }),
  tc: builder.objectType('User').build()
});
```

#### Action Pattern
```javascript
// user.actions.js
export default ({ models, logger }) => ({
  name: 'UserActions',
  methods: {
    createUser: async (input, context) => { ... }
  },
  meta: {
    createUser: { middleware: [...] }
  }
});
```

#### Resolver Pattern
```javascript
// user.resolvers.js
export default ({ models, types }) => ({
  name: 'UserResolvers',
  methods: {
    Query: { ... },
    Mutation: { ... },
    User: { ... }
  }
});
```

## Loader Pipeline

### 1. File Discovery
- Finds files matching pattern: `src/modules/**/*.{type}.js`
- Supports multiple file patterns
- Handles hot reloading in development

### 2. Module Loading
- Imports modules dynamically
- Supports ES modules
- Handles context injection
- Supports factory functions

### 3. Module Processing
- Type-specific processing
- Schema validation
- Circular dependency resolution
- Registry creation

### 4. Context Update
- Immutable updates
- Registry management
- Plugin support

## Usage Examples

### Basic Setup
```javascript
const context = await setupApp();
```

### Using in Modules
```javascript
// In a resolver
export default ({ models, types }) => ({
  name: 'UserResolvers',
  methods: {
    Query: {
      user: async (_, { id }, context) => {
        const { User } = context.models;
        return User.findById(id);
      }
    }
  }
});
```

### Circular Dependencies
```javascript
// User model references Post
const userModel = {
  name: 'User',
  schema: new mongoose.Schema({
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
  })
};

// Post model references User
const postModel = {
  name: 'Post',
  schema: new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  })
};
```

## Best Practices

1. **Module Structure**
   - Use factory functions for context injection
   - Keep modules focused and single-purpose
   - Follow naming conventions

2. **Context Usage**
   - Access only needed context parts
   - Use destructuring for clarity
   - Handle circular dependencies carefully

3. **Error Handling**
   - Use try/catch in async operations
   - Log errors appropriately
   - Provide meaningful error messages

4. **Testing**
   - Test each loader type separately
   - Mock context appropriately
   - Test circular dependencies
   - Test error cases

## API Reference

### createLoader(type)
Creates a loader for a specific type.

### setupApp()
Initializes the application with all loaders.

### createContext(services, registries)
Creates the initial context object.

## Plugins

Plugins can hook into the loader pipeline at various stages:
- `beforeLoad`
- `afterLoad`
- `beforeProcess`
- `afterProcess`

## Development

### Hot Reloading
```javascript
if (process.env.NODE_ENV === 'development') {
  // Setup hot reloading
}
```

### Debugging
```javascript
// Enable debug logging
const context = await setupApp({ debug: true });
```


### UTILITIES

1. **loader-utils.js** - Core Loader Functionality:
    ```javascript
    // Core file discovery and module loading
    export async function findFiles(pattern, { filter, sort, ignore = [], logger } = {}) {
    // Finds files matching glob pattern
    // Used by all loaders to discover their modules
    }

    // Dynamic module loading with context
    export const importAndApply = async (builder, files, { logger } = {}) => {
    // Imports modules and applies them with context
    // Used by loaders to load their modules
    }

    // File watching for hot reload
    export function watchFiles(pattern, onChange, { ignore = [], logger } = {}) {
    // Watches files for changes
    // Used for development hot reloading
    }
    ```

2. **general-utils.js** - Functional Programming Utilities:
    ```javascript
    // Functional composition
    export const pipeAsync = fns => initial =>
    fns.reduce(
        (prevP, fn) => prevP.then(fn),
        Promise.resolve(initial)
    );

    // Object utilities
    export const merge = (...objs) =>
    objs.reduce((acc, o) => mergeDeepRight(acc, o), {});

    // String utilities
    export const toCamelCase = str => // ...
    export const capitalize = str => // ...
    ```


1. **loader-utils.js**:
   - File discovery and pattern matching
   - Dynamic module loading
   - Hot reloading support
   - Error handling and logging
   - Used by all loaders for core functionality

2. **general-utils.js**:
   - Functional programming helpers
   - Object manipulation
   - String formatting
   - Async operation utilities
   - Used by loaders for data transformation

Example usage in a loader:
```javascript
import { findFiles, importAndApply } from './loader-utils.js';
import { pipeAsync, merge } from './general-utils.js';

const createLoader = (type) => async (context) => {
  // Use loader-utils for file operations
  const files = await findFiles(`src/modules/**/*.${type}.js`);
  
  // Use general-utils for functional composition
  return pipeAsync([
    // Find files
    () => findFiles(`src/modules/**/*.${type}.js`),
    // Load modules
    files => importAndApply(context, files),
    // Process modules
    modules => processModules(type, modules),
    // Update context
    registry => updateContext(type, registry, context)
  ])();
};
```

Would you like me to show more examples of how these utilities are used in the loader system?




