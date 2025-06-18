# handler-loader

A robust, modular loader for namespaced and legacy handler modules in the Mantra-Apollo-Mongoose-Pothos server architecture.

---

## 🚀 Features
- **Supports modern and legacy handler module patterns**
- **Automatic namespacing and registry creation**
- **Meta/options attachment for introspection**
- **Context and handlers injection at call time**
- **Duplicate detection and logging**
- **Production-ready, fully tested**

---

## 📦 Usage

### 1. **Import and Use in Your Loader Pipeline**
```js
import handlerLoader from 'src/loaders/handler-loader';

// In your context setup or server bootstrap
await handlerLoader(context);
// context.handlers is now populated
```

### 2. **Supported Module Patterns**

#### **A. Modern: withNamespace Utility**
```js
// modules/post.handlers.js
import { withNamespace } from 'src/utils/withNamespace';

export default withNamespace('post', {
  create: async () => { /* ... */ },
  delete: async () => { /* ... */ }
});
```

#### **B. Factory Export (for context injection)**
```js
// modules/admin.handlers.js
import { withNamespace } from 'src/utils/withNamespace';

export default (context) => withNamespace('admin', {
  impersonate: async () => { /* ... */ }
});
```

#### **C. Array of Namespaced Handlers**
```js
export default [
  { namespace: 'post', name: 'create', method: async () => { /* ... */ } },
  { namespace: 'admin', name: 'impersonate', method: async () => { /* ... */ } }
];
```

#### **D. Legacy Object-by-Namespace**
```js
export default {
  post: {
    create: {
      method: async () => { /* ... */ },
      meta: { legacy: true },
      options: { legacy: true }
    }
  }
};
```

---

## 🧩 Loader Behavior
- All handlers are namespaced: `context.handlers[namespace][name]`
- Each handler receives `{ ...args, context, handlers }` at call time
- Meta/options are attached for introspection if present
- Duplicate handlers are logged as warnings

---

## 🛠️ Migration Notes
- **Legacy modules** (object-by-namespace) are still supported, but migration to the modern pattern is recommended for clarity and composability.
- Use the `withNamespace` utility for new modules.
- Factory exports allow for advanced context injection.
- Change your file naming to `.handlers.js` for discovery.

---

## 🧪 Testing
- See `src/loaders/handler-loader/__tests__` for comprehensive unit and integration tests.
- All supported patterns and edge cases are covered.
- To add new tests, mirror the structure in `action-loader` tests.

---

## 📎 Example: Consuming Handlers
```js
// In your resolver or service
const result = await context.handlers.post.create({ foo: 'bar' });
// context and handlers registry are injected automatically
```

---

## 📝 See Also
- [action-loader.md](./action-loader.md)
- [withNamespace utility](../utils/withNamespace.js)
- [GLOBAL_RULES.md] for architectural standards 