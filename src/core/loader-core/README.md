# loader-core

> **A modern, modular toolkit for building robust, pipeline-friendly loaders and registries.**

---

## 🧩 Modular Structure (Visual)

```
loader-core/
├── index.js         # Entry: import everything from here!
├── registry.js      # Registry strategies & buildRegistry
├── transforms.js    # Named transforms (sync & async) & composeTransforms
├── loader.js        # Loader creation & orchestration (sync)
├── loader-async.js  # Loader creation & orchestration (async)
├── plugins.js       # Plugins, middleware, validation HOFs (sync & async)
```

---

## 🚀 Quickstart

```js
import { createFunctionalLoader, composeTransforms } from './core/loader-core';

const loader = createFunctionalLoader('event', {
  patterns: ['**/*.event.js'],
  registryType: 'event',
  transforms: ['normalizeEvent', 'injectContext', 'addMetadata', 'validationFilter'],
  transform: composeTransforms(['normalizeEvent', 'injectContext', 'addMetadata', 'validationFilter'])
});

const { context } = await loader({ services: myServices });
console.log(context.event); // { eventName: [handler1, handler2, ...] }
```

---

## 📦 What's Inside?

| Export                | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| createFunctionalLoader| Main loader factory, builds registry and context (sync)      |
| createAsyncLoader     | Async loader factory (async file finding, transforms, etc.)  |
| buildRegistry         | Flexible registry builder with strategies                    |
| registryStrategies    | Built-in registry strategies (flat, event, pipeline, etc.)   |
| transformRegistry     | Named transforms for module normalization/enrichment         |
| composeTransforms     | Compose named/custom transforms for loader pipelines         |
| withPlugins           | Add before/after plugin hooks to loaders                     |
| withMiddleware        | Add middleware pipeline to loaders                           |
| withValidation        | Add validation pipeline to loaders                           |

---

## 🔄 Sync & Async Transforms: Co-location Pattern

- **Sync transforms**: Use for fast, pure, in-memory operations.
- **Async transforms**: Use for I/O, API calls, or anything returning a Promise.
- **Co-locate** both in `transforms.js` for discoverability and reuse.

```js
// transforms.js
export const normalizeEvent = (mod, ctx) => { ... };
export const asyncEnrichFromAPI = async (events, ctx) => { ... };

export const transformRegistry = {
  normalizeEvent,
  asyncEnrichFromAPI,
  // ...
};
```

**Use with composeTransforms:**
```js
import { composeTransforms } from './core/loader-core';
const transform = composeTransforms(['normalizeEvent', asyncEnrichFromAPI, 'addMetadata']);
```

---

## 🔄 Sync & Async Plugins: Co-location Pattern

- **Sync plugins**: Fast, pure, no I/O.
- **Async plugins**: For logging, metrics, or anything async.
- **Co-locate** both in `plugins.js` for clarity.

```js
// plugins.js
export const loggingPlugin = { before: ctx => { ... }, after: ctx => { ... } };
export const asyncLoggingPlugin = {
  before: async ctx => { await logAsync('before'); return ctx; },
  after: async ctx => { await logAsync('after'); return ctx; }
};
```

**Use with withPlugins:**
```js
import { withPlugins, asyncLoggingPlugin } from './core/loader-core';
const loader = withPlugins([asyncLoggingPlugin])(createAsyncLoader(...));
```

---

## 🛠️ Example: Mixed Pipeline (Sync + Async)

```js
import {
  createAsyncLoader,
  composeTransforms,
  asyncEnrichFromAPI,
  withPlugins,
  asyncLoggingPlugin,
  loggingPlugin
} from './core/loader-core';

const loader = withPlugins([loggingPlugin, asyncLoggingPlugin])(
  createAsyncLoader('event', {
    patterns: ['**/*.event.js'],
    registryType: 'event',
    transforms: ['normalizeEvent', asyncEnrichFromAPI, 'addMetadata', 'validationFilter'],
    transform: composeTransforms(['normalizeEvent', asyncEnrichFromAPI, 'addMetadata', 'validationFilter'])
  })
);

const { context } = await loader({ services: myServices });
```

---

## 🧠 Cognitive Ease & Best Practices

- **Single import path:** Everything is available from `core/loader-core`.
- **Named transforms/plugins:** Use and compose by name for clarity and reuse.
- **Registry strategies:** Choose or add strategies for how your modules are grouped.
- **Composable pipeline:** Mix plugins, middleware, and transforms for powerful loader flows.
- **Extensible:** Add new transforms to `transforms.js` or new strategies to `registry.js`.
- **Clear separation:** Each file has a focused responsibility—easy to read, test, and extend.
- **Async ready:** Use async transforms/plugins with `createAsyncLoader` for non-blocking pipelines.

---

## ✨ Adding Your Own Transforms or Strategies

**Add a transform:**
1. Open `transforms.js`.
2. Add a function to `transformRegistry` (sync or async).
3. Use it by name in your loader's `transforms` array.

**Add a registry strategy:**
1. Open `registry.js`.
2. Add a function to `registryStrategies`.
3. Use it by name via the `registryType` option in your loader.

---

## 💡 Tips
- Use `composeTransforms` to combine any number of named or custom transforms (sync or async).
- Use `withPlugins`, `withMiddleware`, and `withValidation` to build robust, testable loader pipelines.
- All loaders are pipeline-friendly: pass the returned `context` to the next loader or step.
- The codebase is ready for async transforms, advanced validation, and more.

---

**Happy loading!** 🎉 