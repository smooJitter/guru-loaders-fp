# Feature Loader Guide

## Overview

The Feature Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting modular GraphQL features into your application context. Each feature is a code-first, context-injected GraphQL module that can register types, queries, mutations, and resolvers.

---

## What Does the Loader Do?

- **Discovers** all feature folders (e.g., `src/features/*/index.js`).
- **Dynamically imports** each feature's `index.js` file, which must export a factory function.
- **Injects context** into each feature's factory, enabling access to models, services, config, etc.
- **Collects feature manifests** (objects with `typeComposers`, `queries`, `mutations`, `resolvers`).
- **Merges all feature artifacts** into the app context using robust, immutable merging (via `mergeRegistries`).
- **Detects and reports duplicate names** for typeComposers, queries, mutations, and resolvers.
- **Supports hot-reload and lifecycle hooks** for development and extensibility.
- **Supports both `.tc.js` and `.types.js` files** for type composers (see below).

---

## Example: Feature Folder Structures (Flat & Organized)

### Flat Structure (Simple Projects)
```
src/features/user/
  user.types.js
  user.queries.js
  user.mutations.js
  user.resolvers.js
src/features/post/
  post.types.js
  post.queries.js
  post.mutations.js
  post.resolvers.js
```

### Organized Structure (Recommended for Scale)
```
src/features/user/
  types/
    user.types.js
  queries/
    user.queries.js
  mutations/
    user.mutations.js
  resolvers/
    user.resolvers.js
  index.js
src/features/post/
  types/
    post.types.js
  queries/
    post.queries.js
  mutations/
    post.mutations.js
  resolvers/
    post.resolvers.js
  index.js
```

### Supported Type Composer Filenames
- `user.tc.js` or `user.types.js` (both are discovered and merged as type composers)
- You can use either or both, but be consistent within your project.

---

## Example: user.types.js (or user.tc.js)
```js
export default (context) => {
  const { schemaComposer } = context;
  return schemaComposer.createObjectTC({
    name: 'User',
    fields: {
      _id: 'MongoID!',
      name: 'String!',
      email: 'String!',
    }
  });
};
```

## Example: user.queries.js
```js
export default (context) => {
  const UserTC = context.typeComposers.User;
  return {
    userById: UserTC.getResolver('findById'),
    userList: UserTC.getResolver('findMany'),
  };
};
```

## Example: index.js (feature registration)
```js
import createUserType from './types/user.types.js';
import createUserQueries from './queries/user.queries.js';
import createUserMutations from './mutations/user.mutations.js';
import createUserResolvers from './resolvers/user.resolvers.js';

export default function registerUserFeature(context) {
  const UserTC = createUserType(context);
  return {
    typeComposers: { User: UserTC },
    queries: createUserQueries({ ...context, typeComposers: { ...context.typeComposers, User: UserTC } }),
    mutations: createUserMutations({ ...context, typeComposers: { ...context.typeComposers, User: UserTC } }),
    resolvers: createUserResolvers(context),
  };
}
```

---

## Example: Feature Aggregation with index.js

For larger features or teams, you may want to aggregate all artifacts for a feature in a single `index.js` file. This makes imports easier and supports feature-level encapsulation.

### Flat Structure Example
```
src/features/user/
  user.types.js
  user.queries.js
  user.mutations.js
  user.resolvers.js
  index.js
```

**src/features/user/index.js:**
```js
import createUserType from './user.types.js';
import createUserQueries from './user.queries.js';
import createUserMutations from './user.mutations.js';
import createUserResolvers from './user.resolvers.js';

export default function registerUserFeature(context) {
  const UserTC = createUserType(context);
  return {
    typeComposers: { User: UserTC },
    queries: createUserQueries({ ...context, typeComposers: { ...context.typeComposers, User: UserTC } }),
    mutations: createUserMutations({ ...context, typeComposers: { ...context.typeComposers, User: UserTC } }),
    resolvers: createUserResolvers(context),
  };
}
```

### Organized Structure Example
```
src/features/user/
  types/
    user.types.js
  queries/
    user.queries.js
  mutations/
    user.mutations.js
  resolvers/
    user.resolvers.js
  index.js
```

**src/features/user/index.js:**
```js
import createUserType from './types/user.types.js';
import createUserQueries from './queries/user.queries.js';
import createUserMutations from './mutations/user.mutations.js';
import createUserResolvers from './resolvers/user.resolvers.js';

export default function registerUserFeature(context) {
  const UserTC = createUserType(context);
  return {
    typeComposers: { User: UserTC },
    queries: createUserQueries({ ...context, typeComposers: { ...context.typeComposers, User: UserTC } }),
    mutations: createUserMutations({ ...context, typeComposers: { ...context.typeComposers, User: UserTC } }),
    resolvers: createUserResolvers(context),
  };
}
```

---

## How Are Features Merged?

- All feature manifests are collected into arrays of registries (typeComposers, queries, mutations, resolvers).
- The loader uses `mergeRegistries` (from `registry-utils.js`) to immutably merge all registries into the app context.
- Duplicate names are detected and reported before merging.

---

## Diagram: Feature Loader and Feature Folders

```mermaid
flowchart TD
  subgraph Feature: User
    T[user.types.js (factory)]
    Q[user.queries.js (factory)]
    M[user.mutations.js (factory)]
    R[user.resolvers.js (factory)]
    I[index.js]
  end
  subgraph Feature: Post
    PT[post.types.js]
    PQ[post.queries.js]
    PM[post.mutations.js]
    PR[post.resolvers.js]
    PI[index.js]
  end
  FL[feature-loader.js] --> I
  FL --> PI
  I -->|calls with context| T & Q & M & R
  PI -->|calls with context| PT & PQ & PM & PR
  T & Q & M & R & PT & PQ & PM & PR -->|merge| C[appContext]
```

---

## Best Practices

- **Export a factory function** from each feature file, accepting the app context.
- **Never import models, services, or other features directly**—always use the injected context.
- **Document the expected context shape** in each factory's JSDoc.
- **Test each factory with mocked context.**
- **Support hot-reloading by making factories idempotent and stateless.**
- **Use clear, unique names** for all type composers, queries, and mutations to avoid conflicts.
- **Be consistent with artifact naming** (`.tc.js` or `.types.js`) and folder structure.
- **Consider aggregating artifacts** (e.g., `mutations/index.js`) for large teams or codebases.

---

## Summary
- The feature loader enables scalable, modular, code-first GraphQL development.
- Each feature is a self-contained, context-injected module.
- All features are merged into the app context immutably and safely.
- Both `.tc.js` and `.types.js` are supported for type composers.
- This pattern is maintainable, testable, and a best practice for modern GraphQL backends. 