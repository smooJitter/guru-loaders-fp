# Data Loader Module

This folder implements a **namespaced, composable data loader system** for the project.

## Features
- **Namespaced registry:** Data loaders are grouped by `model` (or other namespace key).
- **Composable:** Easily add, merge, or override data loaders by model and name.
- **Validation:** Each data loader must have a `model`, `name`, and `batchFn`.
- **Standardized logging and error handling.**
- **Future-proof:** The [dataloader](https://www.npmjs.com/package/dataloader) npm package is available for use in your data loader modules.

## Expected Data Loader Module Shape
```js
export default {
  model: 'user',
  name: 'byId',
  batchFn: async (ids, context) => { /* ... */ },
  options: { /* ...optional... */ }
};
```
- You may also export an array of such objects, or a factory function returning them.

## Registry Output Shape
```js
{
  ...ctx,
  dataLoaders: {
    user: { byId: { ... }, byEmail: { ... } },
    product: { byId: { ... } }
  }
}
```

## Usage
- Place your data loader modules in files matching `*.data.js`.
- Each module must export at least `model`, `name`, and `batchFn`.
- You may use the `DataLoader` npm package in your modules for batching/caching.

---

For advanced usage, see the loader implementation in `loader.js`. 