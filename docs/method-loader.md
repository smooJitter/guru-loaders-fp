# Method Loader Guide

## Overview

The Method Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting method modules into your application context. Methods are general-purpose functions or utilities that encapsulate business logic, validation, or domain-specific operations.

---

## What Does the Loader Do?

- **Discovers** all files matching your method patterns (e.g., `**/*.methods.js`).
- **Validates** that each module exports the expected shape (e.g., functions or objects of functions).
- **Injects** context/services into each method definition.
- **Aggregates** all methods into a registry, keyed by name, and attaches it to `appContext.methods`.
- **Warns** on duplicate names to prevent accidental overwrites.

---

## Example: `.methods.js` File Structure

A method module can export a factory function, a plain object, or named exports. Here are some common patterns:

### 1. **Factory Function (Recommended)**
```js
// user.methods.js
export default ({ services }) => ({
  validateUser: (user) => { /* ... */ },
  calculateAge: (user) => { /* ... */ }
});
```

### 2. **Plain Object**
```js
// post.methods.js
export default {
  validatePost: (post) => { /* ... */ },
  summarizePost: (post) => { /* ... */ }
};
```

### 3. **Named Exports**
```js
// comment.methods.js
export const validateComment = (comment) => { /* ... */ };
export const formatComment = (comment) => { /* ... */ };
```

---

## What Does It Mean to Have Methods on the appContext?

When the loader runs, it aggregates all valid method definitions and attaches them to `appContext.methods` as a registry keyed by name:

```js
appContext.methods = {
  validateUser: (user) => { ... },
  calculateAge: (user) => { ... },
  // ...
};
```

This means your application can easily invoke methods from actions, resolvers, or other business logic.

---

## How Are Methods Used Throughout an App?

### 1. **In Actions, Resolvers, or Services**
```js
const resolvers = {
  Query: {
    userAge: (parent, { id }, context) => {
      const user = ... // fetch user
      return context.methods.calculateAge(user);
    }
  }
};
```

### 2. **Best Practices**
- **Keep methods pure and composable** where possible.
- **Inject context/services** rather than importing them directly.
- **Use clear, unique names** for each method to avoid registry conflicts.
- **Document each method** with JSDoc for maintainability.

---

## Summary
- The method loader makes it easy to register, validate, and inject all your method definitions into the app context.
- Methods can be invoked from anywhere in your app, supporting modular, testable business logic.
- This pattern is scalable, maintainable, and a best practice for modern backends. 