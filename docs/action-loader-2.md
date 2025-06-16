# Action Loader 2 (Upgraded)

## Overview

`action-loader-2` is a loader for actions that supports **namespaced** `context.actions` and modern action definitions. It is designed for modular, testable, and maintainable codebases.

---

## Key Features
- **Namespaced Registry:** Actions are grouped by namespace: `context.actions[namespace][name]`
- **Multiple Export Patterns:** Supports factory functions, arrays, and objects
- **Context Injection:** Automatically injects context and actions registry
- **Meta/Options Support:** Actions can include metadata and options
- **Duplicate Detection:** Warns about duplicate actions in the same namespace
- **Loader Hooks:** Supports logging, validation, error handling, and context injection

---

## Recommended File Patterns

To keep your codebase clean and consistent, use these patterns for action file discovery:

```js
const actionLoader = createActionLoader2({
  patterns: [
    // 1. Direct action files (anywhere in src/)
    'src/**/*.actions.js',           // e.g., src/actions/user.actions.js, src/modules/user/user.actions.js

    // 2. Action directories (must use -actions suffix and have index.js)
    'src/**/*-actions/index.js',     // e.g., src/actions/customer-actions/index.js, src/modules/user/user-actions/index.js
  ],
  // ... other options
});
```

**Guidelines:**
- Use `.actions.js` suffix for single-file action modules.
- Use a `-actions` directory with an `index.js` for grouped or complex actions.
- Avoid dots in folder names; use hyphens for action directories.
- Do not place unrelated `index.js` files in `actions/` unless they are part of a `-actions` directory.

---

## Usage Patterns

### 1. Factory Export (Recommended)
```js
export default (context) => ({
  user: {
    create: {
      method: async ({ context, userData }) => { /* ... */ },
      meta: { audit: true }
    },
    // ... more actions
  }
});
```

### 2. Array Export
```js
export default [
  {
    namespace: 'user',
    name: 'create',
    method: async ({ context, userData }) => { /* ... */ },
    meta: { audit: true }
  },
  // ... more actions
];
```

### 3. Object Export
```js
export default {
  user: {
    create: {
      method: async ({ context, userData }) => { /* ... */ },
      meta: { audit: true }
    },
    // ... more actions
  }
};
```

---

## Action Structure

Every action must have:
```js
{
  namespace: 'user',    // Required: groups actions
  name: 'create',       // Required: the action name
  method: async ({ context, ...args }) => { /* ... */ },  // Required: the function
  meta: {              // Optional: metadata
    audit: true
  },
  options: {           // Optional: runtime options
    // ...
  }
}
```

---

## Context Structure

The loader creates a namespaced structure in the context:
```js
context.actions = {
  user: {
    create: (args) => method({ ...args, context, actions: registry }),
    // ...
  }
};
```

---

## Testing

### 1. Unit Testing an Action
```js
describe('user actions', () => {
  it('create should create a user', async () => {
    const mockContext = { 
      services: { 
        db: { User: { create: jest.fn() } } 
      } 
    };
    const result = await createUser({ 
      context: mockContext, 
      userData: { name: 'Test' } 
    });
    expect(mockContext.services.db.User.create)
      .toHaveBeenCalledWith({ name: 'Test' });
  });
});
```

---

## Best Practices

1. **Use Factory Exports** for better context handling
2. **Keep Actions Focused** - one clear responsibility
3. **Use Metadata** for behavior control
4. **Test Actions** in isolation
5. **Handle Errors** consistently
6. **Avoid Duplicate Actions** in the same namespace

---

## Migration Notes
- Replace old flat action exports with namespaced objects
- Use factory exports if you need context at definition time
- Add metadata for behavior control
- Test actions as pure functions

---

## See Also
- [Loader Hooks](../hooks/)
- [Testing Patterns](../__tests__/README.md) 