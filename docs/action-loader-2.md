# Action Loader 2 (Upgraded)

## Overview

`action-loader-2` is an upgraded loader for actions that supports **namespaced** `context.actions`, advanced meta/options, and modern, DRY action definitions. It is designed for modular, testable, and maintainable codebases.

---

## Key Features
- **Namespaced Registry:** Actions are grouped by namespace: `context.actions[namespace][name]`.
- **Registry Array Pattern:** Actions are defined as an array of objects with `namespace`, `name`, and `method`.
- **withNamespace Utility:** Simplifies authoring actions in a DRY, error-free way.
- **Factory Exports:** Supports exporting a function that receives context and returns actions.
- **Meta/Options:** Each action can include `meta` and `options` for introspection, docs, or runtime behavior.
- **Loader Hooks:** Composable with logging, validation, error handling, and context injection hooks.
- **Duplicate Detection:** Warns (or throws) on duplicate actions in the same namespace.

---

## Usage Patterns

### 1. Using `withNamespace`
```js
import { withNamespace } from '../../utils/withNamespace.js';

export default withNamespace('post', {
  create: async ({ context, postData }) => { /* ... */ },
  delete: async ({ context, postId }) => { /* ... */ }
});
```

### 2. With Meta/Options
```js
export default withNamespace('post', {
  create: {
    method: async ({ context, postData }) => { /* ... */ },
    meta: { audit: true }
  }
});
```

### 3. Factory Export (for context at definition time)
```js
import { withNamespace } from '../../utils/withNamespace.js';

export default (context) =>
  withNamespace('post', {
    create: async ({ postData }) => { /* ... use context ... */ }
  });
```

### 4. Direct Registry Array (for cross-namespace or meta-heavy files)
```js
export default [
  { namespace: 'post', name: 'create', method: async (args) => { /* ... */ } },
  { namespace: 'admin', name: 'impersonate', method: async (args) => { /* ... */ } }
];
```

---

## Loader Output

The loader aggregates all actions into:
```js
context.actions = {
  post: {
    create: async (args) => { /* ... */ },
    delete: async (args) => { /* ... */ }
  },
  admin: {
    impersonate: async (args) => { /* ... */ }
  }
};
```

---

## Testing

### 1. Unit Testing a Namespaced Action
```js
// src/modules/post/__tests__/post-actions.test.js
import actions from '../post.actions.js';

describe('post actions', () => {
  it('create should create a post and track analytics', async () => {
    const mockContext = { services: { db: { Post: { create: jest.fn() } }, analytics: { trackEvent: jest.fn() } } };
    const [createAction] = actions.filter(a => a.name === 'create');
    const postData = { title: 'Test', tags: ['a'] };
    await createAction.method({ context: mockContext, postData });
    expect(mockContext.services.db.Post.create).toHaveBeenCalledWith(postData);
    expect(mockContext.services.analytics.trackEvent).toHaveBeenCalledWith('post:create', expect.any(Object));
  });
});
```

### 2. Integration Testing the Loader
```js
import actionLoader2 from '../../src/loaders/action-loader-2/index.js';

describe('action-loader-2 integration', () => {
  it('should load and namespace actions correctly', async () => {
    const mockContext = { services: { logger: { warn: jest.fn() } } };
    const modules = [
      // Simulate a module using withNamespace
      { default: [
        { namespace: 'post', name: 'create', method: jest.fn() },
        { namespace: 'post', name: 'delete', method: jest.fn() }
      ] },
      // Simulate a factory export
      { default: () => [
        { namespace: 'admin', name: 'impersonate', method: jest.fn() }
      ] }
    ];
    const registry = actionLoader2.options.transform(modules, mockContext);
    expect(registry.post.create).toBeInstanceOf(Function);
    expect(registry.admin.impersonate).toBeInstanceOf(Function);
  });
});
```

---

## Improved Usage Examples

### Using withNamespace (Recommended)
```js
import { withNamespace } from '../../utils/withNamespace.js';

export default withNamespace('post', {
  create: async ({ context, postData }) => { /* ... */ },
  delete: async ({ context, postId }) => { /* ... */ },
  update: async ({ context, postId, updates }) => { /* ... */ },
  list: async ({ page = 1, limit = 10 }) => { /* ... */ },
  getStats: async ({ postId }) => { /* ... */ }
});
```

### With Meta/Options
```js
export default withNamespace('post', {
  create: {
    method: async ({ context, postData }) => { /* ... */ },
    meta: { audit: true }
  },
  delete: {
    method: async ({ context, postId }) => { /* ... */ },
    options: { requiresAdmin: true }
  }
});
```

### Factory Export (for context at definition time)
```js
import { withNamespace } from '../../utils/withNamespace.js';

export default (context) =>
  withNamespace('post', {
    create: async ({ postData }) => { /* ... use context from closure ... */ },
    delete: async ({ postId }) => { /* ... */ }
  });
```

### Direct Registry Array (for cross-namespace or meta-heavy files)
```js
export default [
  { namespace: 'post', name: 'create', method: async (args) => { /* ... */ } },
  { namespace: 'admin', name: 'impersonate', method: async (args) => { /* ... */ } }
];
```

---

## Migration Notes
- Replace old flat action exports with registry array or withNamespace pattern.
- Use factory exports if you need context at definition time.
- Meta/options are now supported per action.
- Loader is fully compatible with hooks and middleware.
- Test actions as pure functions, or test the loader output for integration.

---

## See Also
- [withNamespace Utility](../utils/withNamespace.js)
- [Loader Hooks](../hooks/)
- [Testing Patterns](../__tests__/README.md) 