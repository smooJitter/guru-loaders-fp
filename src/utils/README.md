# Utilities Overview

The `src/utils/` directory provides foundational helpers for functional programming, file operations, validation, and loader orchestration. These utilities are essential for building, composing, and testing loaders and pipelines in the `guru-loaders-fp` framework.

---

## 📦 Utility Modules & Their Roles

### 1. Functional Programming Utilities (`fp-utils.js`)
**Intent:** Provide async-friendly, composable functional helpers for pipelines, registry management, and error handling.

**Exports:**
- `pipeAsync`, `composeAsync`, `safePipeAsync`, `safeComposeAsync` — Compose async functions into pipelines.
- `tapAsync`, `mapAsync`, `filterAsync`, `reduceAsync`, `groupByAsync`, `partitionAsync`, `sortAsync`, `uniqueAsync` — Async collection helpers.
- `debounceAsync`, `throttleAsync`, `retryAsync`, `cacheAsync` — Control async execution and caching.
- `createContextFactory`, `createRegistry`, `createPipeline` — Factories for context, registry, and pipeline management.
- `withErrorHandling` — Wraps async functions with error logging.
- `transformModule`, `mergeRegistries`, `createDependencyGraph` — Module and registry helpers.
- `toCamelCase`, `capitalize`, `merge` — String and object utilities.

#### Example: Async Pipeline

```js
import { pipeAsync } from './fp-utils';

const pipeline = pipeAsync(
  asyncStep1,
  asyncStep2,
  asyncStep3
);

pipeline(initialValue).then(result => ...);
```

---

### 2. Loader Utilities (`loader-utils.js`)
**Intent:** Provide factories and helpers for building robust, extensible loader functions with validation, plugins, middleware, and hot reload.

**Exports:**
- `createLoader` — Factory for building loader functions with validation, hot reload, and registry creation.
- `createLoaderWithPlugins`, `createLoaderWithMiddleware`, `createLoaderWithValidation`, `createLoaderWithTransformation` — Compose loaders with plugins, middleware, validation, or transformation steps.

#### Example: Custom Loader

```js
import { createLoader } from './loader-utils';

const myLoader = createLoader('myType', {
  patterns: ['**/myType/**/*.myType.js'],
  validate: myValidateFn,
  watch: true
});
```

---

### 3. File Utilities (`file-utils.js`)
**Intent:** Provide async file and directory operations for module discovery, import, and management.

**Exports:**
- `findFiles` — Glob-based file discovery.
- `importAndApply` — Import a module and apply context if it's a function.
- `watchFiles` — Watch files for changes (hot reload).
- `getFileMetadata`, `readFile`, `writeFile`, `ensureDir`, `listDir`, `copyFile`, `moveFile`, `deleteFile` — File and directory management.

---

### 4. Validation Utilities (`validate-utils.js`)
**Intent:** Provide validation and dependency checking for modules, context, and exports.

**Exports:**
- `validateModule` — Type-specific module validation.
- `validateContext` — Ensure required context keys are present.
- `detectCircularDeps` — Detect circular dependencies in module graphs.
- `validateDependencies`, `validateExports` — Check module dependencies and required exports.

---

## 🗂️ Archival & Legacy
- The `fp/` subdirectory and any legacy/experimental utilities are now in `utils/_archive/`.
- Only the above modules are canonical and actively support the loader/pipeline system.

---

## 🧪 Testing Utilities

- All utilities are designed for testability and can be used in isolation.
- Use mocks for file system and context when testing loader and file utilities.

---

## ✅ Best Practices
- Use `pipeAsync` and related helpers to compose all async logic.
- Always validate modules and context before registration.
- Prefer pure functions and stateless utilities for maximum composability and testability. 