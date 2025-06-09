# Testing Best Practices & Guidelines (MVP+)

This document outlines the best practices for managing and writing tests in this codebase. It is intended for both human contributors and AI code generation agents.

---

## 📐 Test Structure & Placement
- **Unit tests:** Place in `__tests__/` folders near the code under test or in `src/__tests__/` for shared logic.
- **Integration tests:** Use `*.integration.test.js` naming and group in `__tests__/` or a dedicated `integration/` folder if needed.
- **E2E tests:** Place in a top-level `e2e/` directory or `src/__tests__/e2e/`.
- **Test file naming:** Use `.test.js`, `.spec.js`, or `.integration.test.js` for clarity.

## 🧪 Test Types & Coverage
- **Every action, model, guard, and API must have at least 3 tests:**
  - Happy path
  - Edge case
  - Failure/rejection path
- **Hooks:** Each hook must be tested for its core behavior, error handling, and edge cases.
- **Utilities:** Test for correct output, error handling, and edge conditions.
- **Coverage:** Coverage reporting is enabled and should be monitored for regressions.

## 🛠️ Tooling & Setup
- **Jest** is the test runner (ESM mode, Babel enabled).
- **@jest/globals** for ESM test globals.
- **supertest** for HTTP endpoint testing.
- **pino** and **pino-pretty** for logging (mock or silence in tests).
- **ramda-adjunct** for functional utilities.
- **babel-jest** for modern JS transforms.

## 🧑‍💻 Human & AI Agent Guidelines
- **Do not depend on real services** in unit/integration tests.
- **Always mock context and logger** in tests.
- **Update this README** with any new conventions or pain points.
- **Log nuance adjustments** (see below) to help future contributors and AI agents avoid repeated issues.

## 🚀 ESM Loader & Pipeline Testing Patterns
- **Dependency Injection:** All loader and pipeline modules must accept injectable dependencies (e.g., `findFiles`, `importModule`, `validateModule`, etc.) via their options object. This is required because ESM exports are read-only and cannot be mocked directly in tests.
- **Return Value:** Loader functions (e.g., `featureLoader`, pipeline loaders) always return the merged context object. Tests must check the returned value, not the input context or legacy error wrappers.
- **Test Assertions:** Always assert on the returned context's properties (e.g., `typeComposers`, `queries`, etc.), not on mutation of the input context or on `{ errors, ... }` wrappers.
- **Mocking:** Use dependency injection to provide mocks for file discovery, dynamic import, validation, and logger functions. Never attempt to overwrite or spy on ESM imports directly.

## 🛠️ Nuance Adjustments & Lessons Learned
| Date       | Change/Adjustment | Reason/Outcome |
|------------|-------------------|----------------|
| 2024-06-08 | Refactored all loaders and pipeline to use dependency injection for ESM testability; loaders now return merged context, and tests assert on return value | ESM exports are read-only and cannot be mocked; DI enables robust, future-proof testing and composability |
| 2024-06-07 | Changed `babel.config.js` from ESM (`export default`) to CommonJS (`module.exports`) | Jest and Babel require CommonJS config files for compatibility; ESM config caused all tests to fail |
| 2024-06-07 | Resolved Jest/Babel version mismatch (29.x vs 30.x beta) by aligning all Jest-related packages to 29.7.0 | Mixed versions caused persistent ESM config errors; stable, matching versions are required for ESM+Babel compatibility |
| 2024-06-07 | Renamed `babel.config.js` to `babel.config.cjs` | Jest and Node only treated the config as CommonJS after this change; the test system only ran effectively after switching to `.cjs` |
| 2024-06-07 | Fixed import paths in pipeline and utility modules | Relative import paths must be correct for Jest to resolve modules |
| 2024-06-07 | Replaced removed `R.pipeP` with custom `pipeAsync` | Ramda v0.27+ removed `pipeP`; async composition now uses project utility |
| 2024-06-07 | Refactored pipeline loader to allow mocking dynamic imports in tests | ESM `import()` cannot be easily mocked; dependency injection enables robust testing |
| 2024-06-07 | Updated tests to match curried utility APIs | All async utilities use curried form for composability |
| 2024-06-07 | All hooks now have 100% test coverage | Each hook is tested for core logic, error handling, and edge cases |

**Note:** For ESM projects, always use `.cjs` for config files (e.g., `babel.config.cjs`, `jest.config.cjs`) to ensure Node and Jest treat them as CommonJS. This is essential for test system stability.

## 🧩 Example: Hook Test Strategy
- **lifecycleHook:** Test that all methods run, non-functions are skipped, and context is returned.
- **contextInjectionHook:** Test that context is injected and a new object is returned.
- **errorHandlingHook:** Test that errors are logged and rethrown, and success returns the result.
- **validationHook:** Test that valid modules pass and invalid ones throw.
- **loggingHook:** Test that messages are logged and context is returned.

## 🟢 Current Status
- All `/src` tests pass, including hooks, utilities, and pipeline logic.
- Coverage is enforced and reported after each run.
- Legacy and broken tests have been removed or ignored.

---

## 📋 Test Coverage Improvement Tasks

_This section tracks prioritized files/functions for coverage improvement. Update as progress is made._

**Priority Order (lowest coverage first):**

- [ ] **src/loaders/action-loader.js** — _Very low coverage (lines: 14.54%, branches: 2.32%)_
- [ ] **src/loaders/method-loader.js** — _Very low coverage (lines: 13.55%, branches: 1.92%)_
- [ ] **src/utils/async-collection-utils.js** — _Low function/branch coverage (functions: 35%, branches: 0%)_
- [ ] **src/utils/file-utils.js** — _Low function coverage (35.29%)_
- [ ] **src/utils/validate-utils.js** — _Low function/branch coverage (functions: 46.15%, branches: 31.42%)_
- [ ] **src/core/pipeline/create-pipeline.js** — _Low branch coverage (31.57%)_
- [ ] **src/hooks/errorHandling.hook.js** — _Low branch coverage (42.85%)_
- [ ] **src/utils/registry-utils.js** — _Low branch coverage (0%)_
- [ ] **src/utils/loader-utils.js** — _Moderate branch coverage (53.12%)_
- [ ] **src/hooks/lifecycle.hook.js** — _Moderate line/branch coverage (lines: 69.23%, branches: 66.66%)_

**Instructions:**
- For each file, add at least 3 tests per function (happy, edge, fail).
- Focus on untested branches and error handling.
- Mock context/services as per project rules.
- Mark files as complete when coverage is improved and update this list.

---

_Keep this log updated with any new adjustments, lessons, or best practices as the codebase evolves._

---

## 📝 Nuance Adjustment Log

| Date       | Change/Observation | Reason/Impact |
|------------|--------------------|---------------|
| 2024-06-06 | Switched logger to pino/pino-pretty, updated all logger mocks | Ensures consistent, structured logging in tests and dev |
| 2024-06-06 | Added Babel config for ESM Jest | Required for modern JS and ESM compatibility |
| 2024-06-06 | Enforced explicit import of test globals from @jest/globals | Prevents missing globals in ESM tests |
| 2024-06-07 | Changed babel.config.js from ESM (export default) to CommonJS (module.exports) | Jest and Babel require CommonJS config files for compatibility; ESM config caused all tests to fail |
| 2024-06-07 | Resolved Jest/Babel version mismatch (29.x vs 30.x beta) by aligning all Jest-related packages to 29.7.0 | Mixed versions caused persistent ESM config errors; stable, matching versions are required for ESM+Babel compatibility |
| 2024-06-07 | Renamed `babel.config.js` to `babel.config.cjs` | Jest and Node only treated the config as CommonJS after this change; the test system only ran effectively after switching to `.cjs` |
| 2024-06-07 | Fixed import paths in pipeline and utility modules | Relative import paths must be correct for Jest to resolve modules |
| 2024-06-07 | Replaced removed `R.pipeP` with custom `pipeAsync` | Ramda v0.27+ removed `pipeP`; async composition now uses project utility |
| 2024-06-07 | Refactored pipeline loader to allow mocking dynamic imports in tests | ESM `import()` cannot be easily mocked; dependency injection enables robust testing |
| 2024-06-07 | Updated tests to match curried utility APIs | All async utilities use curried form for composability |
| 2024-06-07 | All hooks now have 100% test coverage | Each hook is tested for core logic, error handling, and edge cases |
| 2024-06-08 | Refactored all loaders and pipeline to use dependency injection for ESM testability; loaders now return merged context, and tests assert on return value | ESM exports are read-only and cannot be mocked; DI enables robust, future-proof testing and composability |
| YYYY-MM-DD | ...                | ...           |

---

## ✅ Checklist for New Tests
- [ ] Test covers happy, edge, and failure paths
- [ ] All external dependencies are mocked
- [ ] Logger is mocked or silenced
- [ ] Test file is named and placed correctly
- [ ] Nuance log updated if new issues or conventions arise

---

_Keep this document up to date to ensure a healthy, maintainable, and AI-friendly testing stack!_ 