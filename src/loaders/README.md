# Guru Loaders: Unified Documentation

> **Note:** This document unifies and supersedes the previous `DICTIONARY.md`, `README.md`, and `USAGE.md`. All loader standards, usage, and architecture are now documented here.

---

## 1. Overview

The Loader system is the backbone of the `guru-loaders-fp` framework, enabling modular, context-driven, and highly composable application assembly. Each loader is responsible for discovering, validating, transforming, and registering a specific type of module (e.g., models, actions, resolvers).

**Key goals:**
- Modularity
- Composability
- Context-driven enrichment
- Reliability & testability

---

## 2. Architecture & Design

### Loader Creation Pattern

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

### Loader Pipeline

All loaders are composed into a pipeline that builds up the application context. The pipeline is orchestrated using the `pipeAsync` utility, ensuring each loader receives the latest context and can augment it.

### Extending Loaders

To add a new loader:
1. Create a new file in `src/loaders/` (e.g., `my-loader.js`)
2. Use the `createLoader` pattern with your own validation and transformation logic.
3. Add your loader to the loader pipeline or context as needed.

---

## 3. Loader Types Reference

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

## 4. Usage Guide

### Installation

To get started with the loaders, ensure that all necessary dependencies are installed:

```bash
npm install
```

Ensure your environment is set up correctly by configuring the necessary environment variables and config files as described in the `env` loader section.

### Basic Usage

#### Loading Environment Configurations
```js
import { createEnvLoader } from './env-loader';
const envLoader = createEnvLoader();
await envLoader(context);
```

#### Setting Up Database Connections
```js
import { createDbLoader } from './db-loader';
const dbLoader = createDbLoader();
await dbLoader(context);
```

#### Registering Models
```js
import { createModelLoader } from './model-loader';
const modelLoader = createModelLoader();
await modelLoader(context);
```

### Advanced Usage

- Customizing loader behavior (validation, transformation)
- Integrating with other modules (middleware, plugins)
- Configuration via environment variables, config files, or runtime parameters

### Troubleshooting

- **Missing Environment Variables:** Ensure all required environment variables are set before running the loaders.
- **Database Connection Errors:** Check the database URI and credentials in the `db` loader configuration.
- **Debugging Tips:** Use console logs or a debugger to trace the execution flow and identify issues within the loaders.

---

## 5. Testing & Reliability

- **Defensive input validation:** All loaders must validate input and handle null, undefined, or invalid arguments gracefully.
- **Error handling:** All loaders must catch and log errors, and never throw uncaught exceptions during normal operation.
- **Test coverage:** Every loader and utility is covered by comprehensive tests for happy, edge, and failure paths, with 80%+ branch coverage required.
- **Reliability:** Loaders are resilient to unexpected input and runtime errors, as demonstrated by the test suite.
- **Where tests live:** Each loader and utility should have unit tests in `src/loaders/__tests__/` or `src/utils/__tests__/` as appropriate.
- **Mocking and isolation:** Mock external dependencies (e.g., database, cache) for isolation.

---

## 6. Best Practices & Rules

- Keep loader files focused and under 100 lines if possible.
- Use pure functions for validation and transformation.
- Always validate module shape before registration.
- Document any non-obvious logic with comments and `# Reason:` tags.
- See `GLOBAL_RULES.md` for project-wide rules and standards.

---

## 7. References & Further Reading

- [Main Project README](../README.md): Overview of the project and its components.
- [GLOBAL_RULES.md](../GLOBAL_RULES.md): Project-wide rules and standards.
- [src/loaders/index.js]: Loader aggregation and exports.
- [src/core/pipeline/create-pipeline.js]: Pipeline orchestration.
- For more details, see the loader's source file or the main `README.md` in this directory. 