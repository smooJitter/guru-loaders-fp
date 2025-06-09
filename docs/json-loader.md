# JSON Loader Guide

## Overview

The JSON Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting JSON modules into your application context. These modules can provide configuration, static data, or any structured object needed by your app.

---

## What Does the Loader Do?

- **Discovers** all files matching your JSON patterns (e.g., `**/*.json.js`).
- **Validates** that each module exports the expected shape (e.g., `name`, `data`, `options`).
- **Injects** context/services into each JSON definition if needed.
- **Aggregates** all JSON objects into a registry, keyed by name, and attaches it to `appContext.jsons`.
- **Warns** on duplicate names to prevent accidental overwrites.

---

## Example: `.json.js` File Structure

A JSON module can export a factory function, a plain object, or an array of objects. Here are some common patterns:

### 1. **Factory Function (Recommended)**
```js
// user-config.json.js
export default ({ services }) => ({
  name: 'userConfig',
  data: {
    maxUsers: 100,
    roles: ['admin', 'user', 'guest']
  },
  options: { cache: true }
});
```

### 2. **Plain Object**
```js
// post-config.json.js
export default {
  name: 'postConfig',
  data: {
    maxPosts: 50,
    allowComments: true
  }
};
```

### 3. **Array of JSON Objects**
```js
// multi-config.json.js
export default [
  {
    name: 'commentConfig',
    data: { maxComments: 200 }
  },
  {
    name: 'likeConfig',
    data: { maxLikes: 1000 }
  }
];
```

---

## What Does It Mean to Have JSONs on the appContext?

When the loader runs, it aggregates all valid JSON objects and attaches them to `appContext.jsons` as a registry keyed by name:

```js
appContext.jsons = {
  userConfig: { name: 'userConfig', data: { ... } },
  postConfig: { name: 'postConfig', data: { ... } },
  // ...
};
```

This means your application can easily access any loaded JSON object by name from anywhere in your app.

---

## How Are JSONs Used Throughout an App?

### 1. **In Actions, Methods, or Services**
```js
// Example action using a JSON config
export default ({ jsons }) => ({
  createUser: async ({ input }) => {
    if (jsons.userConfig.data.maxUsers < input.count) {
      throw new Error('User limit exceeded');
    }
    // ...
  }
});
```

### 2. **Best Practices**
- **Use factory functions** to allow context injection if needed.
- **Use clear, unique names** for each JSON object to avoid registry conflicts.
- **Document each JSON module** with JSDoc for maintainability.
- **Avoid direct imports of JSON modules** in business logic; always use the injected context.

---

## Summary
- The JSON loader makes it easy to register, validate, and inject all your JSON definitions into the app context.
- JSONs can be accessed from anywhere in your app, supporting modular, testable configuration and static data.
- This pattern is scalable, maintainable, and a best practice for modern backends. 