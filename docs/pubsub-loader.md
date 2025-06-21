# PubSub Loader Guide

## Overview

The PubSub Loader in `guru-loaders-fp` is responsible for discovering, validating, and injecting pubsub modules into your application context. PubSub modules define topics, handlers, and options for event-driven communication within your app (e.g., for GraphQL subscriptions, event buses, or message queues).

---

## Loader Pattern (Modern, Minimal, Future-Proof)

- **Declarative:** Uses `createAsyncLoader` from `loader-core`.
- **No transform step:** All context injection and factory support is handled by `importAndApplyAll`.
- **Registry built by builder:** Uses `buildPubsubRegistryWithWarning` for a flat registry with duplicate warning.
- **Validation is pure and minimal:** Only checks for `name` (string).
- **Duplicate warnings:** Handled by the registry builder, not the loader.
- **Composable and testable:** Loader is a pure configuration, not an imperative function.

---

## What Does the Loader Do?

- **Discovers** all files matching your pubsub patterns (e.g., `**/*.pubsub.js`).
- **Validates** that each module exports the expected shape (e.g., `name`).
- **Injects** context/services into each pubsub definition if needed (handled by import logic).
- **Aggregates** all pubsub objects into a registry, keyed by name, and attaches it to `appContext.pubsubs`.
- **Warns** on duplicate names to prevent accidental overwrites (handled by registry builder).

---

## Example: `.pubsub.js` File Structure

A pubsub module can export a factory function, a plain object, or an array of objects. Here are some common patterns:

### 1. **Factory Function (Recommended)**
```js
// user.pubsub.js
export default ({ services }) => ({
  name: 'userEvents',
  topics: {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated'
  },
  handlers: {
    USER_CREATED: async (payload, context) => {
      // ...handle event
    }
  },
  options: { durable: true }
});
```

### 2. **Plain Object**
```js
// post.pubsub.js
export default {
  name: 'postEvents',
  topics: {
    POST_PUBLISHED: 'post.published'
  },
  handlers: {
    POST_PUBLISHED: async (payload, context) => { /* ... */ }
  }
};
```

### 3. **Array of PubSub Objects**
```js
// multi.pubsub.js
export default [
  {
    name: 'commentEvents',
    topics: { COMMENT_ADDED: 'comment.added' },
    handlers: { COMMENT_ADDED: async (payload, context) => { /* ... */ } }
  },
  {
    name: 'likeEvents',
    topics: { LIKE_ADDED: 'like.added' },
    handlers: { LIKE_ADDED: async (payload, context) => { /* ... */ } }
  }
];
```

### 4. **Direct PubSub Instance (Apollo, Redis, etc.)**
```js
// notifications.pubsub.js
import { PubSub } from 'apollo-server-express';
export default {
  name: 'notifications',
  pubsub: new PubSub(),
  topics: { NOTIFY: 'notify' },
  handlers: { NOTIFY: async (payload) => { /* ... */ } }
};
```

---

## Loader Implementation (core-loader-new)

```js
import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { findFiles, importAndApplyAll } from '../utils/file-utils-new.js';
import { buildPubsubRegistryWithWarning } from '../core/loader-core/lib/registry-builders.js';

### B. PubSub Module for GraphQL Subscriptions
```js
// chat.pubsub.js
export default {
  name: 'chatEvents',
  topics: {
    MESSAGE_SENT: 'chat.messageSent'
  },
  handlers: {
    MESSAGE_SENT: async (payload, context) => {
      // Push to websocket, log, etc.
    }
  }
};
```

export function createPubsubLoader(options = {}) {
  return createAsyncLoader('pubsubs', {
    patterns: PUBSUB_PATTERNS,
    findFiles,
    importAndApplyAll,
    registryBuilder: buildPubsubRegistryWithWarning,
    validate,
    contextKey: 'pubsubs',
    ...options
  });
}

export default createPubsubLoader();
```

---

## Testing Expectations

- **Every loader must have a robust test suite:**
  - Happy path: valid pubsub objects (factory, object, array)
  - Edge: duplicate names (warn, last wins)
  - Failure: missing name, invalid type, non-object, array with invalids
  - Context propagation: context/services are preserved
  - No transform step: all context injection is handled by import logic
  - Duplicate warnings: only for actual duplicates, not for all invalids
- **Mock `findFiles` and `importAndApplyAll` in tests** for full control and isolation.
- **Logger must be injected in both `context` and `services` for warning checks.**
- **Tests must be minimal, composable, and future-proof.**

---

## What Does It Mean to Have PubSubs on the appContext?

When the loader runs, it aggregates all valid pubsub objects and attaches them to `appContext.pubsubs` as a registry keyed by name:

```js
appContext.pubsubs = {
  userEvents: { name: 'userEvents', topics: { ... }, handlers: { ... }, ... },
  postEvents: { name: 'postEvents', topics: { ... }, handlers: { ... }, ... },
  // ...
};
```

This means your application can easily access any loaded pubsub object by name from anywhere in your app, enabling event-driven logic, subscriptions, or message handling.

---

## Best Practices
- Use factory functions for context injection.
- Use clear, unique names for each pubsub object to avoid registry conflicts.
- Document each pubsub module with JSDoc for maintainability.
- Avoid direct imports of pubsub modules in business logic; always use the injected context.
- Define all topic keys in a central config/constants file if possible.

---

## Summary
- The pubsub loader is now declarative, minimal, and future-proof.
- All context injection and registry logic is handled by the loader-core pipeline.
- Tests must be robust, composable, and enforce the highest standards for loader quality.

## Property Reference

| Property  | Type     | Required | Description                                      |
|-----------|----------|----------|--------------------------------------------------|
| name      | string   |   Yes    | Unique key for the pubsub registry               |
| topics    | object   |   No     | Event/topic keys for this pubsub                 |
| handlers  | object   |   No     | Handler functions for each topic/event           |
| pubsub    | object   |   No     | Direct PubSub engine instance (Apollo, Redis, etc.) |
| options   | object   |   No     | Additional options or metadata                   | 