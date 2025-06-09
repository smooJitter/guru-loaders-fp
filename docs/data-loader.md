# DataLoader Loader Guide

## Overview

The DataLoader loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting data-loader definitions into your application context. These data-loaders are designed to be used with the popular [DataLoader](https://github.com/graphql/dataloader) library, enabling efficient batching and caching of data-fetching operations in GraphQL (or similar) applications.

---

## What Is a DataLoader?

A DataLoader is a utility (commonly used in Apollo Server/GraphQL projects) that batches and caches requests for data, solving the "N+1 query problem." It is instantiated per request and provides a `.load(key)` API for fetching entities by key.

---

## What Does the Loader Do?

- **Discovers** all files matching your data-loader patterns (e.g., `**/*.data.js` or `**/*.dataloader.js`).
- **Validates** that each module exports the expected shape (e.g., `name`, `model`, `batchFn`).
- **Injects** context/services into each data-loader definition.
- **Aggregates** all data-loaders into a registry, keyed by name, and attaches it to `appContext.dataLoaders`.
- **Warns** on duplicate names to prevent accidental overwrites.

---

## Example: `.dataloader.js` File Structure

A data-loader module can export a factory function, a plain object, or an array of objects. Here are some common patterns:

### 1. **Factory Function (Recommended)**
```js
// user.dataloader.js
export default ({ services }) => ({
  name: 'userById',
  model: 'User',
  batchFn: async (ids) => {
    const users = await services.db.User.find({ _id: { $in: ids } });
    return ids.map(id => users.find(u => u._id.equals(id)) || null);
  },
  options: { cache: true }
});
```

### 2. **Plain Object**
```js
// post.dataloader.js
export default {
  name: 'postById',
  model: 'Post',
  batchFn: async (ids, { services }) => {
    const posts = await services.db.Post.find({ _id: { $in: ids } });
    return ids.map(id => posts.find(p => p._id.equals(id)) || null);
  }
};
```

### 3. **Array of DataLoaders**
```js
// multi.dataloader.js
export default [
  {
    name: 'commentById',
    model: 'Comment',
    batchFn: async (ids, { services }) => { /* ... */ }
  },
  {
    name: 'likeById',
    model: 'Like',
    batchFn: async (ids, { services }) => { /* ... */ }
  }
];
```

---

## What Does It Mean to Have DataLoaders on the appContext?

When the loader runs, it aggregates all valid data-loader definitions and attaches them to `appContext.dataLoaders` as a registry keyed by name:

```js
appContext.dataLoaders = {
  userById: { name: 'userById', model: 'User', batchFn, ... },
  postById: { name: 'postById', model: 'Post', batchFn, ... },
  // ...
};
```

This means your application (especially your GraphQL server) can easily instantiate DataLoader instances per request using these definitions.

---

## How Are DataLoaders Used Throughout an App?

### 1. **In Context Setup (Apollo Server Example)**
```js
import DataLoader from 'dataloader';

export const context = ({ req, appContext }) => {
  const { dataLoaders: loaderDefs } = appContext;
  return {
    ...,
    dataLoaders: Object.fromEntries(
      Object.entries(loaderDefs).map(([name, def]) => [
        name,
        new DataLoader(def.batchFn)
      ])
    )
  };
};
```

### 2. **In Resolvers**
```js
const resolvers = {
  Query: {
    user: (parent, { id }, context) => context.dataLoaders.userById.load(id),
    post: (parent, { id }, context) => context.dataLoaders.postById.load(id),
    // ...
  }
};
```

### 3. **Best Practices**
- **Instantiate DataLoader per request** to ensure request-scoped caching.
- **Keep batch functions idempotent and side-effect free** for best results.
- **Use clear, unique names** for each data-loader to avoid registry conflicts.
- **Document each data-loader** with JSDoc for maintainability.

---

## Summary
- The data-loader loader makes it easy to register, validate, and inject all your data-loader definitions into the app context.
- Host apps (like Apollo Server) can then instantiate DataLoader instances per request, using these definitions for efficient, batched, and cached data fetching.
- This pattern is scalable, maintainable, and a best practice for modern GraphQL backends. 