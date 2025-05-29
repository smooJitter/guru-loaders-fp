# Utilities Overview

The `src/utils/` directory provides a robust set of helpers for functional programming, file operations, validation, and loader orchestration. These utilities are foundational for building, composing, and testing loaders and pipelines in the `guru-loaders-fp` framework.

---

## 📦 Utility Modules

### 1. Functional Programming Utilities (`fp-utils.js`, `fp/`)

- **pipeAsync, composeAsync, safePipeAsync, safeComposeAsync**: Compose async functions into pipelines.
- **tapAsync, mapAsync, filterAsync, reduceAsync**: Async versions of common FP patterns.
- **groupByAsync, partitionAsync, sortAsync, uniqueAsync**: Async collection helpers.
- **debounceAsync, throttleAsync, retryAsync, cacheAsync**: Control async execution and caching.
- **createContextFactory, createRegistry, createPipeline**: Factories for context and registry management.
- **withErrorHandling**: Wraps async functions with error logging.
- **transformModule, mergeRegistries, createDependencyGraph**: Module and registry helpers.
- **toCamelCase, capitalize, merge**: String and object utilities.

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

- **createLoader**: Factory for building loader functions with validation, hot reload, and registry creation.
- **createLoaderWithPlugins, createLoaderWithMiddleware, createLoaderWithValidation, createLoaderWithTransformation**: Compose loaders with plugins, middleware, validation, or transformation steps.

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

- **findFiles**: Glob-based file discovery.
- **importAndApply**: Import a module and apply context if it's a function.
- **watchFiles**: Watch files for changes (hot reload).
- **getFileMetadata, readFile, writeFile, ensureDir, listDir, copyFile, moveFile, deleteFile**: File and directory management.

---

### 4. Validation Utilities (`validate-utils.js`)

- **validateModule**: Type-specific module validation.
- **validateContext**: Ensure required context keys are present.
- **detectCircularDeps**: Detect circular dependencies in module graphs.
- **validateDependencies, validateExports**: Check module dependencies and required exports.

---

### 5. Functional Programming Helpers (`fp/general-utils.js`, `fp/pipe-async.js`)

- **pipeAsync**: Minimal async pipeline utility.
- **createContextFactory, createRegistry, createPipeline**: Factories and composition helpers.
- **withErrorHandling, transformModule, mergeRegistries, createDependencyGraph**: Error handling and registry management.

---

## 🧪 Testing Utilities

- All utilities are designed for testability and can be used in isolation.
- Use mocks for file system and context when testing loader and file utilities.

---

## ✅ Best Practices

- Use `pipeAsync` and related helpers to compose all async logic.
- Always validate modules and context before registration.
- Prefer pure functions and stateless utilities for maximum composability and testability. 