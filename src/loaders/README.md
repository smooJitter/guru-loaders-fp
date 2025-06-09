# Loader System

The Loader system is the backbone of the `guru-loaders-fp` framework, enabling modular, context-driven, and highly composable application assembly. Each loader is responsible for discovering, validating, transforming, and registering a specific type of module (e.g., models, actions, resolvers).

---

## 🧩 Loader Architecture

- **Each loader is a factory**: It returns an async function that takes a context and returns an enriched context.
- **Pattern-based discovery**: Loaders use glob patterns to find relevant files (e.g., `**/models/**/*.model.js`).
- **Validation & transformation**: Each loader validates and transforms modules before registration.
- **Composable pipelines**: Loaders are composed into pipelines, allowing for flexible and extensible application bootstrapping.

---

## 🏗️ Loader Creation Pattern

All loaders follow a common pattern using the `createLoader` utility:

```js
import { createLoader } from '../core/pipeline/create-pipeline.js';

export const createMyLoader = (options = {}) =>
  createLoader('myType', {
    ...options,
    patterns: '**/myType/**/*.myType.js',
    validate: (mod) => Boolean(mod.name),
    transform: (mod) => ({ ...mod, type: 'myType' })
  });
```

- **patterns**: Glob(s) for file discovery
- **validate**: Function to check module shape
- **transform**: Function to normalize/augment module

---

## 🚦 Built-in Loaders

| Loader      | Purpose                                 | File Pattern Example                |
|-------------|-----------------------------------------|-------------------------------------|
| env         | Loads environment configs               | `**/env/**/*.env.js`                |
| db          | Sets up database connections            | `**/db/**/*.db.js`                  |
| auth        | Authentication strategies               | `**/auth/**/*.auth.js`              |
| models      | Data models                             | `**/models/**/*.model.js`           |
| types       | Type composition (GraphQL, etc.)        | `**/types/**/*.type.js`             |
| actions     | Business logic actions                  | `**/actions/**/*.action.js`         |
| resolvers   | GraphQL resolvers                       | `**/resolvers/**/*.resolver.js`     |
| routes      | Express/HTTP routes                     | `**/routes/**/*.route.js`           |
| json        | JSON schema or config                   | `**/json/**/*.json.js`              |
| middleware  | Express middleware                      | `**/middleware/**/*.middleware.js`  |
| sdl         | GraphQL SDL                             | `**/sdl/**/*.sdl.js`                |
| faker       | Development data                        | `**/faker/**/*.faker.js`            |
| data        | DataLoader batch functions              | `**/data/**/*.loader.js`            |
| pubsub      | PubSub/event system                     | `**/pubsub/**/*.pubsub.js`          |
| plugin      | Loader plugins                          | `**/plugin/**/*.plugin.js`          |
| event       | Event handlers                          | `**/event/**/*.event.js`            |

See `src/loaders/index.js` for the full list and their factory functions.

---

## 🛠️ Example: Model Loader

```js
// src/loaders/model-loader.js
export const createModelLoader = (options = {}) => {
  const loader = createLoader('model', {
    ...options,
    patterns: '**/models/**/*.model.js',
    validate: (mod) => mod.name && mod.schema && mod.model,
    transform: (mod) => ({
      ...mod,
      type: 'model',
      timestamp: Date.now()
    })
  });
  return loader;
};
```

---

## 🧪 Example: Data Loader

```js
// src/loaders/data-loader.js
export const createDataLoader = (options = {}) => {
  const loader = createLoader('data', {
    ...options,
    patterns: '**/data/**/*.loader.js',
    validate: (mod) => mod.name && mod.model && typeof mod.batchFn === 'function',
    transform: (mod) => ({
      ...mod,
      type: 'data',
      create: (context) => new DataLoader(
        async (keys) => { /* batching logic */ },
        { cache: true }
      )
    })
  });
  return loader;
};
```

## 🌱 Example: Env Loader

```js
// src/loaders/env-loader.js
export const createEnvLoader = (options = {}) => {
  const loader = createLoader('env', {
    ...options,
    patterns: '**/configs/**/*.environment.js',
    validate: (mod) => mod.name && typeof mod === 'object',
    transform: (mod) => ({ ...mod, type: 'env', timestamp: Date.now() })
  });
  return loader;
};
```

### .environment.js File Example

```js
// modules/user/configs/user.environment.js
export default (context) => ({
  name: 'user',
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL || 'http://localhost:3000',
  FEATURE_FLAG: context?.featureFlag || false,
});
```

### Context Key and Access

- All loaded environments are registered at `context.envs[<name>]`.
- Example access:
  ```js
  const userEnv = context.envs.user;
  const apiUrl = context.envs.user.API_URL;
  ```

- Supports both factory and plain object exports.
- Warns on duplicate names or invalid modules.

---

## 🧬 Extending Loaders

To add a new loader:

1. Create a new file in `src/loaders/` (e.g., `my-loader.js`)
2. Use the `createLoader` pattern with your own validation and transformation logic.
3. Add your loader to the loader pipeline or context as needed.

---

## 🧱 Loader Pipeline

All loaders are composed into a pipeline that builds up the application context. The pipeline is orchestrated using the `pipeAsync` utility, ensuring each loader receives the latest context and can augment it.

---

## 🧪 Testing Loaders

- Each loader should have unit tests in `src/loaders/__tests__/`.
- Test validation, transformation, and integration with the context.
- Mock external dependencies (e.g., database, cache) for isolation.

---

## 📚 References

- See `src/loaders/index.js` for loader aggregation and exports.
- See individual loader files for implementation details and extension patterns.
- See `src/core/pipeline/create-pipeline.js` for pipeline orchestration.

---

## ✅ Best Practices

- Keep loader files focused and under 100 lines if possible.
- Use pure functions for validation and transformation.
- Always validate module shape before registration.
- Document any non-obvious logic with comments and `# Reason:` tags. 