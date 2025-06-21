# loader-core

## 🧱 Loader Pattern (loader-core)

> **Important:**  
> The new `loader-core` pipeline does **not** use a `transform` step.  
> All module transformation and context injection must happen in the import logic or test mocks.

### Loader Module Requirements

- **Modules must export either:**
  - An object (with a `name` property), or
  - A factory function that returns such an object when called with the loader context.

- **Factories must be called with context in the import logic** (or in test mocks for unit tests).
  - _Do **not** use a transform step to call factories with context._
  - Example for tests:
    ```js
    importAndApplyAll: async () => factory(ctx)
    ```

- **Validation is context-agnostic.**
  - The `validate` function receives only the module (not context or file).
  - It should only check for required properties (e.g., `name`), and must not log or mutate.

- **The registry builder receives the modules as returned by import, after validation.**

### ⚠️ Do Not Add a Transform Step

- The `transform` step is not part of the `loader-core` pipeline.
- Adding a transform step will have no effect and may cause confusion or bugs.
- All context injection and factory invocation must be handled in the import logic.

---

**Summary:**  
> _If you need to support factory modules, call them with context in your import logic or test mocks.  
> Do not use a transform step.  
> Validation is minimal and context-agnostic.  
> The registry builder receives the final objects as returned by import._

---

## Philosophy
- All registry builders are pure functions.
- Loader pipelines are explicit: discovery → import/context → validation → registry build → assignment.
- No hidden transforms or legacy magic.
- Extensible, modular, and easy to test.

## Directory Structure
```
loader-core/
├── index.js
├── loader.js
├── loader-async.js
├── loader-async-feature.js
├── plugins.js
├── validation.js
├── lib/
│   └── registry-builders.js
├── __tests__/
│   └── (test files)
├── README.md
├── PLANNING.md
├── TASK.md
└── _legacy/ (optional, for migration only)
```

---

## Async Loader Pipeline (Modern Example)

The async loader pipeline is designed to be pure, explicit, and context-aware only at import time. The steps are:

1. **Discovery:** Find files using a glob pattern (e.g., with `findFiles`).
2. **Import/Context:** Use `importAndApplyAll` to import all modules and inject context if needed. Context is only used at this step.
3. **Validation:** Filter modules with a pure validation function.
4. **Registry Build:** Use a pure registry builder (from `lib/registry-builders.js`) to construct the registry.
5. **Assignment:** Assign the registry to the desired context key.

**Example usage:**
```js
import { createAsyncLoader } from './loader-async.js';
import { findFiles, importAndApplyAll } from '../../utils/file-utils-new.js';
import { buildFlatRegistryByName } from './lib/registry-builders.js';

const loader = createAsyncLoader('actions', {
  patterns: ['src/actions/*.js'],
  findFiles,
  registryBuilder: buildFlatRegistryByName,
  validate: mod => typeof mod.name === 'string',
  contextKey: 'actions',
});

const context = await loader({ services: myServices });
console.log(context.actions); // { actionName: actionModule, ... }
```

- **Note:** `importAndApplyAll` is used internally by the loader to ensure context is injected only once, at import time. Registry builders and validation remain pure and context-free.

---

## Sync Loader Pipeline (Modern Example)

The sync loader pipeline mirrors the async pipeline, but all steps are synchronous and pure. Use this for config loading, static analysis, or environments where async is not needed.

**Example usage:**
```js
import { createLoader } from './loader.js';
import { findFilesSync, importAndApplyAllSync } from '../../utils/file-utils-new.js';
import { buildFlatRegistryByName } from './lib/registry-builders.js';

const loader = createLoader('actions', {
  patterns: ['src/actions/*.js'],
  findFiles: findFilesSync,
  importAndApplyAll: importAndApplyAllSync,
  registryBuilder: buildFlatRegistryByName,
  validate: mod => typeof mod.name === 'string',
  contextKey: 'actions',
});

const context = loader({ services: myServices });
console.log(context.actions); // { actionName: actionModule, ... }
```

- **Note:** All steps are synchronous and pure. Use the sync loader for environments where async is not required.

---

## Feature Loader Pipeline (Files + Directories)

The feature loader pipeline is designed to handle both files and directories, aggregating feature manifests for modular, scalable architectures.

**Example usage:**
```js
import { createFeatureLoader } from './loader-async-feature.js';
import { buildFeatureRegistries } from './lib/registry-builders.js';

const featureLoader = createFeatureLoader({
  patterns: ['src/features/*'],
  validate: manifest => typeof manifest === 'object',
  contextKey: 'features',
});

const context = await featureLoader({ services: myServices });
console.log(context.features); // { typeComposers, queries, mutations, resolvers }
```

- **Note:** The feature loader uses `findFilesAndDirs` for discovery and `importAndApplyAllFeatures` for import/context, so it can process both feature directories (with index.js) and individual files.

---

## Plugins & Middleware (Functional, Ramda-powered)

All plugin, middleware, and validation composition is pure, functional, and leverages Ramda for composability.

### Example Plugins
```js
import { loggingPlugin, asyncLoggingPlugin } from './plugins.js';

// Sync plugin
const loggingPlugin = {
  before: ctx => { console.log('Before loading...'); return ctx; },
  after: ctx => { console.log('After loading!'); return ctx; }
};

// Async plugin
const asyncLoggingPlugin = {
  before: async ctx => { await new Promise(res => setTimeout(res, 10)); console.log('Async before loading...'); return ctx; },
  after: async ctx => { await new Promise(res => setTimeout(res, 10)); console.log('Async after loading!'); return ctx; }
};
```

### Composing Plugins
```js
import { withPlugins } from './plugins.js';

const loaderWithPlugins = withPlugins([loggingPlugin, asyncLoggingPlugin])(loader);
await loaderWithPlugins(context);
```

### Middleware and Validation
```js
import { withMiddleware, withValidation } from './plugins.js';

const mw = async ctx => ({ ...ctx, mw: true });
const validator = async ctx => { if (!ctx.ok) throw new Error('Not ok!'); };

const loaderWithAll = withValidation([validator])(withMiddleware([mw])(loaderWithPlugins));
await loaderWithAll({ ok: true });
```

### Advanced: Composing and Filtering Plugins
```js
import { composePlugins, filterPlugins } from './plugins.js';

const featureAPlugins = [loggingPlugin];
const featureBPlugins = [asyncLoggingPlugin];

// Merge and dedupe plugin arrays
const allPlugins = composePlugins(featureAPlugins, featureBPlugins);

// Filter plugins by a custom predicate (e.g., by name)
const onlyAsync = filterPlugins(allPlugins, p => p.after && p.after.toString().includes('Async'));

const loaderWithFiltered = withPlugins(onlyAsync)(loader);
await loaderWithFiltered(context);
```

- All composition is async-friendly, pure, and testable.
- Use Ramda idioms for maximum composability and clarity.

---

## Validation (Pure, Composable, Functional)

All validation helpers are pure, composable, and designed for functional pipelines.

### Main Helpers
```js
import {
  isNonEmptyArray,
  isPlainObject,
  isValidModule,
  hasRequiredKeys,
  validateModules,
  validateModulesDetailed,
  isFunctionOrAsyncFunction
} from './validation.js';

// Check if value is a non-empty array
isNonEmptyArray([1, 2, 3]); // true

// Check if value is a plain object
isPlainObject({ foo: 'bar' }); // true

// Check if a module is valid (plain object with string name)
isValidModule({ name: 'foo', handler: () => {} }); // true

// Check if an object has required keys
hasRequiredKeys(['name', 'handler'], { name: 'foo', handler: () => {} }); // true

// Validate modules by predicate
const modules = [ { name: 'a' }, { foo: 1 } ];
const valid = validateModules(modules, isValidModule); // [ { name: 'a' } ]

// Validate modules and get both valid and invalid
const { valid: good, invalid: bad } = validateModulesDetailed(modules, isValidModule);

// Check if value is a function or async function
isFunctionOrAsyncFunction(async () => {}); // true
isFunctionOrAsyncFunction(() => {}); // true
```

### Composing Validation in a Loader Pipeline
```js
import { validateModules, isValidModule, hasRequiredKeys } from './validation.js';

const requiredKeys = ['name', 'handler'];
const valid = validateModules(modules, m =>
  isValidModule(m) && hasRequiredKeys(requiredKeys, m)
);
```

- All helpers are pure and composable, designed for use in Ramda-powered pipelines.
- Use them as building blocks for robust, testable loader validation.

---

See PLANNING.md for architectural vision and TASK.md for ongoing work.
