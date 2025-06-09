# Env Loader

The **env-loader** discovers and registers environment configuration modules for each feature or service in a modular Node.js backend. It enables context-aware, testable, and composable environment management.

---

## Purpose

- Load environment configs from `.environment.js` files in feature/config folders.
- Register each config under `context.envs[<name>]` for easy, modular access.
- Support both static objects and context-aware factory exports.
- Warn on duplicate names or invalid modules.

---

## File Pattern

- `**/configs/**/*.environment.js`
- Place one `.environment.js` per feature or service (e.g., `modules/user/configs/user.environment.js`).

---

## .environment.js File Format

### Factory Export (preferred)
```js
// modules/user/configs/user.environment.js
export default (context) => ({
  name: 'user', // required, used as context key
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL || 'http://localhost:3000',
  FEATURE_FLAG: context?.featureFlag || false,
});
```

### Plain Object Export (static config)
```js
export default {
  name: 'user',
  NODE_ENV: 'development',
  API_URL: 'http://localhost:3000',
  FEATURE_FLAG: false,
};
```

---

## Loader Behavior

- Discovers all `.environment.js` files matching the pattern.
- Imports each module:
  - If export is a function, calls it with the current context.
  - If export is an object, uses it directly.
- Validates that each config has a `name` property (string).
- Registers each config at `context.envs[<name>]`.
- Warns and skips on duplicate names or invalid modules.

---

## Context Key & Access

- All loaded environments are available at `context.envs`:

```js
context.envs = {
  user: {
    name: 'user',
    NODE_ENV: 'development',
    API_URL: 'http://localhost:3000',
    FEATURE_FLAG: false,
  },
  payment: {
    name: 'payment',
    STRIPE_KEY: 'sk_test_...',
    ENABLED: true,
  },
  // ...
};
```

- Access pattern:
```js
const userEnv = context.envs.user;
const apiUrl = context.envs.user.API_URL;
```

---

## Best Practices

- Always provide a unique `name` property in each `.environment.js` export.
- Use a factory export if you need context-aware or dynamic config.
- Keep secrets and sensitive values out of version control—use environment variables.
- Document any non-obvious logic with comments and `# Reason:` tags.

---

## Example Directory Structure

```
modules/
  user/
    configs/
      user.environment.js
  payment/
    configs/
      payment.environment.js
```

---

## See Also
- [json-loader.md](./json-loader.md)
- [service-loader.md](./service-loader.md)
- [model-loader.md](./model-loader.md) 