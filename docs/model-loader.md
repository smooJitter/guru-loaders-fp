# Model Loader

The **model-loader** automatically discovers and registers all Mongoose models in your project. It supports both direct model exports and factory functions, and attaches all discovered models to `context.models`, keyed by model name.

---

## 🧩 Purpose
- Load all `.model.js` files in the codebase.
- Each file must export a single Mongoose model (directly or via a factory function).
- All models are registered on `context.models` for use throughout the app.

---

## 📦 File & Module Expectations

A valid `.model.js` file must export **one** model, either:

### 1. Direct Model Export
```js
// user.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: String });
export default mongoose.model('User', schema);
```

### 2. Factory Function Export
```js
// product.model.js
export default ({ mongooseConnection }) => {
  const schema = new mongooseConnection.Schema({ sku: String });
  return mongooseConnection.model('Product', schema);
};
```

---

## 🔄 How It Works
- The loader scans for all files matching `**/*.model.js`.
- For each file:
  - If the default export is a function, it is called with `{ mongooseConnection, additionalPlugins }` and must return a Mongoose model.
  - If the default export is a model, it is used directly.
- Each model is added to `context.models` under its `modelName`.
- If a file does not export a valid model, a warning is logged.

---

## 🗝️ Context Key
- All loaded models are attached to `context.models`:
  ```js
  context.models = {
    User: <UserModel>,
    Product: <ProductModel>,
    // ...
  };
  ```

---

## 🧪 Testability
- The loader is fully testable with mocks for file discovery and module import.
- Logger usage is robust: it uses `context.logger`, `context.services.logger`, or falls back to `console`.
- Warnings are issued for invalid or missing models, but the loader continues processing other files.

---

## ⚠️ Error & Warning Handling
- If a `.model.js` file does not export a valid model, a warning is logged (never throws).
- If no logger is present, warnings and info messages are sent to `console`.

---

## ✅ Example Usage
```js
import { createModelLoader } from './src/loaders/model-loader.js';
const modelLoader = createModelLoader(mongoose.connection);
await modelLoader(context);
// context.models now contains all loaded models
``` 