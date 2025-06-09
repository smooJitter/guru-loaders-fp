# Middleware Loader Guide

## Overview

The Middleware Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting middleware modules into your application context. Middleware functions are used to implement cross-cutting concerns (such as logging, authentication, or error handling) and can be composed into pipelines for actions, resolvers, or routes.

---

## What Does the Loader Do?

- **Discovers** all files matching your middleware patterns (e.g., `**/*.middleware.js`).
- **Validates** that each module exports the expected shape (e.g., functions or objects of functions).
- **Injects** context/services into each middleware definition.
- **Aggregates** all middleware into a registry, keyed by name, and attaches it to `appContext.middleware`.
- **Warns** on duplicate names to prevent accidental overwrites.

---

## Example: `.middleware.js` File Structure

A middleware module can export a factory function, a plain object, or named exports. Here are some common patterns:

### 1. **Factory Function (Recommended)**
```js
// logging.middleware.js
export default ({ services }) => async (next, args, context) => {
  services.logger.info('Request args:', args);
  return next(args, context);
};
```

### 2. **Plain Function**
```js
// auth.middleware.js
export default async (next, args, context) => {
  if (!context.user) throw new Error('Unauthorized');
  return next(args, context);
};
```

### 3. **Named Exports**
```js
// error.middleware.js
export const errorHandler = async (next, args, context) => {
  try {
    return await next(args, context);
  } catch (err) {
    context.services.logger.error(err);
    throw err;
  }
};
```

---

## What Does It Mean to Have Middleware on the appContext?

When the loader runs, it aggregates all valid middleware definitions and attaches them to `appContext.middleware` as a registry keyed by name:

```js
appContext.middleware = {
  logging: async (next, args, context) => { ... },
  auth: async (next, args, context) => { ... },
  errorHandler: async (next, args, context) => { ... },
  // ...
};
```

This means your application can easily compose middleware into pipelines for actions, resolvers, or routes.

---

## How Is Middleware Used Throughout an App?

### 1. **In Action or Resolver Pipelines**
```js
const pipeline = [
  context.middleware.logging,
  context.middleware.auth,
  context.middleware.errorHandler
];

const composed = pipeline.reduceRight(
  (next, mw) => (args, ctx) => mw(next, args, ctx),
  actualHandler
);

// Usage
composed(args, context);
```

### 2. **Best Practices**
- **Keep middleware pure and composable** where possible.
- **Inject context/services** rather than importing them directly.
- **Use clear, unique names** for each middleware to avoid registry conflicts.
- **Document each middleware** with JSDoc for maintainability.

---

## Summary
- The middleware loader makes it easy to register, validate, and inject all your middleware definitions into the app context.
- Middleware can be composed into pipelines for actions, resolvers, or routes, supporting modular, testable cross-cutting logic.
- This pattern is scalable, maintainable, and a best practice for modern backends. 