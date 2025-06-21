# TESTING.md — loader-core

## 🧬 Loader-Core Testing Philosophy: What Makes It Unique

- All context injection is explicit and only at import time—never in registry builders or transforms.
- Registry builders, validation, and plugin/middleware logic are pure, composable, and Ramda-powered.
- Loader pipelines are explicit, stepwise, and testable—no hidden transforms or magic.
- Feature loader is uniquely designed to aggregate feature manifests from both files and directories, supporting modular, scalable architectures.
- Tests emphasize composability and functional purity—property-based and table-driven tests are encouraged for registry builders and validation.
- No transforms.js: all transformation is explicit in the loader pipeline.

---

_Authoritative guide for testing all loader-core modules, loaders, plugins, validation, and registry builders._

---

## 🛠️ Key Testing Philosophy & Challenges

- **Context Injection:**
  - All context is injected at import time (via `importAndApplyAll` or variants). Tests must mock context as needed for each loader or feature.
- **Pure Functions:**
  - Registry builders, validation helpers, and most plugin/middleware logic are pure and should be tested as such.
  - Property-based and table-driven tests are encouraged for registry builders and validation.
- **Plugin/Middleware Composition:**
  - Test that plugins and middleware compose correctly and preserve context.
- **Feature Loader Scenarios:**
  - Feature loader must handle both files and directories; tests should cover both cases.
- **Composability:**
  - Test that loader pipelines, plugins, and validation can be composed and reused.
- **No transforms.js:**
  - All transformation is explicit in the loader pipeline; there is no transforms.js in loader-core.

---

## 📚 Context & Scope
- **This file applies to:** All loaders (`loader.js`, `loader-async.js`, `loader-async-feature.js`), plugins, validation, registry builders, and any submodules.
- **Always read [`PLANNING.md`](./PLANNING.md), [`TASK.md`](./TASK.md), and [`README.md`](./README.md) for architectural and process context.**

---

## 🧪 Test Coverage Requirements
- **Every loader, registry builder, plugin, and validation helper must have at least 3 tests:**
  - ✅ Happy path (expected/valid input)
  - ❓ Edge case (boundary, empty, missing, etc.)
  - ❌ Failure/rejection (invalid input, error propagation, etc.)
- **Tests must live in `__tests__/` folders** matching the module structure.
- **Composability:** At least one test should demonstrate composing multiple plugins, middleware, or loader steps.

---

## 🧱 Test Structure & Patterns

### 1. **Mocking Context and Inputs**
- **Never use real DB or external services in unit tests.**
- **Mock context** as needed for loader pipelines:
  ```js
  const mockContext = () => ({
    services: {},
    user: { id: 'test-user', roles: ['ADMIN'] },
    tenant: { id: 'test-tenant' },
    // ...other context fields as needed
  });
  ```
- **Override mocks per test** to simulate edge/failure conditions.

### 2. **Testing Pure Functions (Registry Builders, Validation, Plugins)**
- Test with static data; no context or side effects.
- Property-based and table-driven tests are encouraged for registry builders and validation.
- Example:
  ```js
  import { buildFlatRegistryByName } from '../lib/registry-builders.js';
  describe('buildFlatRegistryByName', () => {
    it('should build a flat registry by name', () => {
      const mods = [{ name: 'foo', value: 1 }, { name: 'bar', value: 2 }];
      expect(buildFlatRegistryByName(mods)).toEqual({ foo: mods[0], bar: mods[1] });
    });
    // Table-driven example
    it.each([
      [[{ name: 'x' }], { x: { name: 'x' } }],
      [[], {}],
    ])('should handle input %#', (input, expected) => {
      expect(buildFlatRegistryByName(input)).toEqual(expected);
    });
  });
  ```

### 3. **Testing Loader Pipelines**
- Use mock file utilities to simulate file discovery and import.
- Test both sync and async pipelines.
- Example:
  ```js
  import { createLoader } from '../loader.js';
  import { buildFlatRegistryByName } from '../lib/registry-builders.js';
  it('should build registry from files', () => {
    const files = ['a.js', 'b.js'];
    const mockFindFiles = () => files;
    const mockImportAndApplyAll = () => [ { name: 'a' }, { name: 'b' } ];
    const loader = createLoader('test', {
      patterns: ['*'],
      findFiles: mockFindFiles,
      importAndApplyAll: mockImportAndApplyAll,
      registryBuilder: buildFlatRegistryByName,
      validate: m => !!m.name,
      contextKey: 'test',
    });
    const context = loader({});
    expect(context.test).toEqual({ a: { name: 'a' }, b: { name: 'b' } });
  });
  ```

### 4. **Testing Plugins & Middleware**
- Test before/after hooks, middleware chains, and validation composition.
- Example:
  ```js
  import { withPlugins, loggingPlugin } from '../plugins.js';
  it('should call before and after hooks', async () => {
    const loader = async ctx => ({ ...ctx, loaded: true });
    const wrapped = withPlugins([loggingPlugin])(loader);
    const result = await wrapped({});
    expect(result.loaded).toBe(true);
  });
  ```

### 5. **Testing Feature Loader**
- Simulate both file and directory inputs.
- Mock `findFilesAndDirs` and `importAndApplyAllFeatures` as needed.
- **Uniqueness:** The feature loader is designed to aggregate feature manifests from both files and directories, supporting true modularity and feature encapsulation. This is a key differentiator of loader-core.
- Example:
  ```js
  import { createFeatureLoader } from '../loader-async-feature.js';
  it('should aggregate feature manifests from files and directories', async () => {
    const mockFindFilesAndDirs = () => ['featureA', 'featureB'];
    const mockImportAndApplyAllFeatures = () => [
      { typeComposers: { A: {} } },
      { typeComposers: { B: {} } }
    ];
    const loader = createFeatureLoader({
      patterns: ['*'],
      findFiles: mockFindFilesAndDirs,
      importAndApplyAll: mockImportAndApplyAllFeatures,
      validate: m => !!m.typeComposers,
      contextKey: 'features',
    });
    const context = await loader({});
    expect(context.features.typeComposers).toHaveProperty('A');
    expect(context.features.typeComposers).toHaveProperty('B');
  });
  ```

---

## Shared Test Utilities & Mocks

- All shared mocks and test utilities must live in `__tests__/lib/`.
- Never patch or modify production code for test purposes—always use or extend these shared helpers.
- Update or add new helpers in `__tests__/lib/` as the codebase evolves.

### Examples

**`__tests__/lib/mockContext.js`**
```js
export const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['ADMIN'] },
  tenant: { id: 'test-tenant' },
  ...overrides,
});
```

**`__tests__/lib/mockFileUtils.js`**
```js
export const mockFindFiles = files => () => files;
export const mockImportAndApplyAll = modules => () => modules;
```

**`__tests__/lib/mockPlugins.js`**
```js
export const beforePlugin = {
  before: ctx => ({ ...ctx, before: true }),
};
export const afterPlugin = {
  after: ctx => ({ ...ctx, after: true }),
};
```

**`__tests__/lib/registryMocks.js`**
- Canonical mocks for all registry types built by registry builders. Use these for all registry builder tests.
```js
import {
  flatModules, flatRegistry,
  namespacedModules, namespacedRegistry,
  hierarchicalModules, hierarchicalRegistry,
  eventModules, eventRegistry,
  featureManifests, featureRegistry
} from './registryMocks.js';

// Example usage in a test:
import { buildFlatRegistryByName } from '../lib/registry-builders.js';
describe('buildFlatRegistryByName', () => {
  it('should build a flat registry by name', () => {
    expect(buildFlatRegistryByName(flatModules)).toEqual(flatRegistry);
  });
});
```
- Always use these mocks for registry builder tests to ensure consistency and clarity.

**Advanced registry mocks and patterns:**
- Use these for property-based, edge-case, and merge/override tests.

```js
import {
  deepHierarchicalModules, deepHierarchicalRegistry,
  advancedEventModules, advancedEventRegistry,
  overlappingFeatureManifests, overlappingFeatureRegistry,
  emptyModules, missingKeyModules, invalidTypeModules
} from './registryMocks.js';

// Deeply nested hierarchical registry
expect(buildHierarchicalRegistry(deepHierarchicalModules)).toEqual(deepHierarchicalRegistry);

// Advanced event registry with multiple event types
expect(buildEventRegistry(advancedEventModules)).toEqual(advancedEventRegistry);

// Overlapping feature manifests (merge/override)
expect(buildFeatureRegistries(overlappingFeatureManifests)).toEqual(overlappingFeatureRegistry);

// Edge cases
expect(buildFlatRegistryByName(emptyModules)).toEqual({});
expect(buildFlatRegistryByName(missingKeyModules)).toEqual({ foo: { name: 'foo' } });
// Use invalidTypeModules to test validation and error handling
```

- Always use these advanced mocks for property-based, edge-case, and merge/override tests to ensure robustness and clarity.

- All test files should import and use these helpers for context, file utilities, plugins, and registry mocks.
- This ensures consistency, maintainability, and strict separation between test and production code.

---

## 🏗️ Adding New Tests
- Place new test files in the appropriate `__tests__/` folder.
- Use the patterns above for context, mocks, and composition.
- **Name test files** as `<feature>-<type>.test.js` (e.g., `loader-async-feature.test.js`).
- **Update this file** if you introduce new testing conventions or patterns.

---

## 🚦 Running Tests & Coverage
- Run all tests for loader-core:
  ```sh
  npx jest src/core/loader-core --runInBand
  ```
- Run a specific test file:
  ```sh
  npx jest src/core/loader-core/__tests__/loader-async-feature.test.js --runInBand
  ```
- Check coverage:
  ```sh
  npx jest --coverage
  ```
- **Coverage thresholds:** 80%+ required for statements, branches, lines, and functions.

---

## 🤖 AI Contributor Guidance
- **Do NOT generate tests that use real services or DB.**
- **Do NOT assume context shape—always mock as above.**
- **If unsure about a test scenario, ask for clarification or check PLANNING.md.**
- **Always update this file if you introduce new test patterns.**

---

## 📎 References
- [`PLANNING.md`](./PLANNING.md)
- [`TASK.md`](./TASK.md)
- [`README.md`](./README.md)

---

_Last updated: 2024-06-17_

# Real-File Integration Test Pattern

- All real-file integration test fixtures must use `.mjs` for ESM compatibility.
- Integration tests should use the real loader and real filesystem modules, not mocks, for at least one test suite.
- Always assert that logger methods (error, warn) are called as expected for error cases.
- If adding new fixture files, place them in `__fixtures__` and use `.mjs` extension.
- Ensure Jest is configured for ESM and `.mjs` support (see jest.config.js).
- Document any new edge cases or error patterns in this file for future contributors and AI.

## Feature Directory Entrypoint Order

- When loading a feature from a directory (e.g., under `src/features/` or `src/modules/`), the loader will attempt to import:
  1. `index.js` (ESM, project convention)
- No `.mjs` or `.cjs` is supported or expected for entrypoints.
- If no entrypoint is found, the directory is skipped (optionally log a warning).
