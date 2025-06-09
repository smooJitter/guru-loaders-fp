# Action Loader Guide

## Overview

The Action Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting action modules into your application context. Actions represent business logic or operations that can be invoked by other parts of your app (e.g., resolvers, services, or other actions).

---

## What Does the Loader Do?

- **Discovers** all files matching your action patterns (e.g., `**/*.actions.js`).
- **Validates** that each module exports the expected shape (e.g., functions or objects of functions).
- **Injects** context/services into each action definition.
- **Aggregates** all actions into a registry, keyed by name, and attaches it to `appContext.actions`.
- **Warns** on duplicate names to prevent accidental overwrites.

---

## Example: `.actions.js` File Structure

An action module can export a factory function, a plain object, or named exports. Here are some common patterns:

### 1. **Factory Function (Recommended)**
```js
// user.actions.js
export default ({ services }) => ({
  createUser: async ({ input, context }) => {
    // ...business logic
    return services.db.User.create(input);
  },
  deleteUser: async ({ id, context }) => {
    // ...business logic
    return services.db.User.deleteOne({ _id: id });
  }
});
```

### 2. **Plain Object**
```js
// post.actions.js
export default {
  createPost: async ({ input, context }) => { /* ... */ },
  deletePost: async ({ id, context }) => { /* ... */ }
};
```

### 3. **Named Exports**
```js
// comment.actions.js
export const addComment = async ({ input, context }) => { /* ... */ };
export const removeComment = async ({ id, context }) => { /* ... */ };
```

---

## What Does It Mean to Have Actions on the appContext?

When the loader runs, it aggregates all valid action definitions and attaches them to `appContext.actions` as a registry keyed by name:

```js
appContext.actions = {
  createUser: async ({ input, context }) => { ... },
  deleteUser: async ({ id, context }) => { ... },
  // ...
};
```

This means your application can easily invoke actions from resolvers, services, or other business logic.

---

## How Are Actions Used Throughout an App?

### 1. **In Resolvers or Services**
```js
const resolvers = {
  Mutation: {
    createUser: (parent, args, context) => context.actions.createUser({ input: args.input, context }),
    deleteUser: (parent, args, context) => context.actions.deleteUser({ id: args.id, context })
  }
};
```

### 2. **Best Practices**
- **Keep actions pure and composable** where possible.
- **Inject context/services** rather than importing them directly.
- **Use clear, unique names** for each action to avoid registry conflicts.
- **Document each action** with JSDoc for maintainability.

---

## Summary
- The action loader makes it easy to register, validate, and inject all your action definitions into the app context.
- Actions can be invoked from anywhere in your app, supporting modular, testable business logic.
- This pattern is scalable, maintainable, and a best practice for modern backends. 