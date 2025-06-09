# Hooks

This directory contains modular, reusable hook functions for use in loader pipelines and other composable systems.

## Conventions
- All hook files use the `.hook.js` extension for clarity and discoverability.
- Each hook is documented with JSDoc and is intended to be pure, composable, and context-aware.
- Use the `index.js` barrel file to import hooks conveniently:

```js
import { loggingHook, validationHook, errorHandlingHook, contextInjectionHook, lifecycleHook } from '../hooks';
```

## Available Hooks & Their Roles

- **`loggingHook(context, message)`**
  - Logs a message using the context's logger.
  - Use this to provide context-aware logging at any step in a loader pipeline or modular process.
  - Ensures all logs are routed through the app's logger for consistency and traceability.

- **`validationHook(module, schema)`**
  - Validates a module against a provided schema (object of property names and expected types).
  - Throws an error if validation fails, enforcing module shape and contract.
  - Use this to catch misconfigured or incomplete modules early in the pipeline.

- **`errorHandlingHook(fn, context, ...args)`**
  - Wraps an async function, logs any errors using the context's logger, and rethrows.
  - Use this to safely execute steps in the pipeline, ensuring errors are always logged and surfaced.
  - Helps prevent silent failures and centralizes error reporting.

- **`contextInjectionHook(module, context)`**
  - Attaches the current context to a module, returning a new object with the context property.
  - Use this to ensure modules have access to the loader or app context for further processing or execution.
  - Promotes context-aware, dependency-injected module design.

- **`lifecycleHook(lifecycleMethods, context)`**
  - Runs an array of lifecycle methods (functions) with the provided context.
  - Use this to trigger setup, teardown, or custom lifecycle events during loader execution.
  - Ensures all lifecycle logic is executed in a consistent, context-aware manner.

---

Hooks are designed for extensibility and can be composed or extended as your loader system evolves. 