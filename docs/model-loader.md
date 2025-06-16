# Model Loader

The **model-loader** automatically discovers and registers all Mongoose models in your project. It supports both direct model exports and factory functions, and attaches all discovered models to `context.models`, keyed by model name.

---

## 🧩 Purpose
- Load all `.model.js` files in the codebase.
- Each file must export a single Mongoose model (directly or via a factory function).
- All models are registered on `context.models` for use throughout the app.

---

## 📦 File & Module Expectations

A valid `.model.js` file must export **one** model, using one of the following patterns:

### 1. Direct Model Export
```js
// user.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: String });
export default mongoose.model('User', schema);
```

### 2. Factory Function Export (Context-Based, Preferred)
```js
// product.model.js
export default (context) => {
  const { mongooseConnection } = context;
  const schema = new mongooseConnection.Schema({ sku: String });
  return mongooseConnection.model('Product', schema);
};
```

### 3. Mixed Variant (Schema Outside, Model from Context)
```js
// invoice.model.js
import mongoose from 'mongoose';
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
});

invoiceSchema.virtual('isOverdue').get(function () {
  return this.dueDate < new Date();
});

export default (context) => {
  const { mongooseConnection } = context;
  return mongooseConnection.model('Invoice', invoiceSchema);
};
```

> **Note:**
> - The context-based factory function export is preferred for consistency with other loaders.
> - The mixed variant is technically valid and useful when you want to define the schema once and use it with different connections.

---

## 🔍 Comparison of Model Export Variants

| Variant         | Context-Aware | Multi-Connection | Schema Reuse | Simplicity | Consistency with Loaders |
|-----------------|:-------------:|:----------------:|:------------:|:----------:|:------------------------:|
| Direct Export   |      ❌       |        ❌        |     ❌       |    ✅      |           ❌             |
| Factory (Ctx)   |      ✅       |        ✅        |     ❌       |    ➖      |           ✅             |
| Mixed           |      ✅       |        ✅        |     ✅       |    ➖      |           ✅             |

### Direct Model Export
- **How it works:** Schema and model are created using the default `mongoose` import. The file exports the model directly.
- **Pros:** Simple and concise. No need to pass context or connections. Good for single-connection apps.
- **Cons:** Not flexible for multi-connection setups. Not consistent with context-based loaders.

### Factory Function Export (Context-Based, Preferred)
- **How it works:** Exports a function that receives the full `context`. Extracts `mongooseConnection` from context and uses it to create both the schema and the model.
- **Pros:** Fully consistent with other loaders that use context. Supports multi-connection and dependency injection patterns. Clean separation of schema/model creation per context.
- **Cons:** Slightly more verbose. Schema is re-created on each call (usually not a problem).

### Mixed Variant (Schema Outside, Model from Context)
- **How it works:** Schema is defined once, outside the export. The exported function receives context and uses `mongooseConnection` to create the model from the pre-defined schema.
- **Pros:** Schema is defined only once, which can be DRY if reused. Still supports context-based model creation. Useful if you want to share the schema definition across multiple models/connections.
- **Cons:** The schema is always tied to the default `mongoose` import, which could cause subtle issues if used with multiple connections (e.g., plugins or schema options that depend on the connection). Slightly less "pure" than the context-based factory, but still valid.

> **Recommendation:**
> - Use the **context-based factory function** for new code for maximum flexibility and consistency.
> - The **mixed variant** is valid for advanced use cases (schema reuse, plugins, etc.).
> - The **direct export** is best for simple, single-connection projects.

---

## 🧩 Extracting Additional Components from Context

In advanced scenarios, you may want to extract more than just the connection from `context`. For example, you might use plugins, utility functions, or other helpers provided by the application context. This pattern enables powerful dependency injection and customization.

### Example: Using a Plugin from Context
```js
// document.model.js
export default (context) => {
  const { mongooseConnection, plugins } = context;

  const documentSchema = new mongooseConnection.Schema({
    title: { type: String, required: true },
    content: { type: String },
    owner: { type: mongooseConnection.Schema.Types.ObjectId, ref: 'User' },
  });

  // Apply a plugin from context, e.g., soft delete functionality
  if (plugins?.softDelete) {
    documentSchema.plugin(plugins.softDelete);
  }

  return mongooseConnection.model('Document', documentSchema);
};
```

### Example: Using a Utility Function from Context
```js
// audit-log.model.js
export default (context) => {
  const { mongooseConnection, addAuditFields } = context;

  let auditLogSchema = new mongooseConnection.Schema({
    action: { type: String, required: true },
    entityId: { type: String, required: true },
    entityType: { type: String, required: true },
  });

  // Use a utility function from context to add audit fields
  if (typeof addAuditFields === 'function') {
    auditLogSchema = addAuditFields(auditLogSchema);
  }

  return mongooseConnection.model('AuditLog', auditLogSchema);
};
```

**Benefits:**
- Enables dependency injection for plugins, helpers, or environment-specific logic.
- Keeps model files flexible and decoupled from global imports.
- Supports feature toggling and advanced customization per context.

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