# Event Loader Guide

## Overview

The **Event Loader** in `guru-loaders-fp` discovers, validates, and injects event handler modules into your application context. Event modules define named handlers for business or system events, supporting both single and multiple events per file, and both factory and object exports.

---

## What Does the Loader Do?

- **Discovers** all files matching your event patterns (e.g., `**/*.event.js`).
- **Validates** that each module exports the expected shape (`name`, `handler`, optional `options`).
- **Injects** context/services into each event if needed.
- **Aggregates** all event objects into a registry, keyed by name, and attaches it to `context.events`.
- **Warns** on duplicate names to prevent accidental overwrites.
- **Logs** a summary of loaded events for debugging.

---

## Example: `.event.js` File Structure

A module can export a factory function, a plain object, or an array of objects:

### 1. **Factory Function (Recommended)**
```js
// userCreated.event.js
export default (context) => ({
  name: 'userCreated',
  handler: async (payload, ctx) => {
    // ...handle event
  },
  options: { once: true }
});
```

### 2. **Plain Object**
```js
// userUpdated.event.js
export default {
  name: 'userUpdated',
  handler: async (payload, ctx) => { /* ... */ },
  options: { once: false }
};
```

### 3. **Array of Events**
```js
// multi.event.js
export default [
  {
    name: 'eventA',
    handler: async (payload) => { /* ... */ }
  },
  {
    name: 'eventB',
    handler: async (payload) => { /* ... */ }
  }
];
```

---

## Loader Behavior

- Discovers all `.event.js` files matching the pattern.
- Imports each module:
  - If export is a function, calls it with the current context.
  - If export is an object or array, uses it directly.
- Validates that each event has a `name` (string) and `handler` (function).
- Registers each event at `context.events[<name>]`.
- Warns and skips on duplicate names or invalid modules.
- Logs a summary of loaded events.

---

## Context Key & Access

- All loaded events are available at `context.events`:

```js
context.events = {
  userCreated: {
    name: 'userCreated',
    handler: async (payload, ctx) => { /* ... */ },
    options: { once: true },
    type: 'event',
    timestamp: 1680000000000
  },
  userUpdated: { ... },
  // ...
};
```

- Access pattern:
```js
const handler = context.events.userCreated.handler;
await handler(payload, context);
```

---

## Best Practices

- Always provide a unique `name` property in each event export.
- Use a factory export if you need context-aware or dynamic event handlers.
- Document any non-obvious logic with comments and `# Reason:` tags.
- Use the `options` property for event meta (e.g., `{ once: true }`).
- Avoid direct imports of event modules in business logic; always use the injected context.

---

## Property Reference

| Property  | Type     | Required | Description                                      |
|-----------|----------|----------|--------------------------------------------------|
| name      | string   |   Yes    | Unique key for the event registry                |
| handler   | function |   Yes    | Event handler function                           |
| options   | object   |   No     | Additional options or metadata                   |
| type      | string   |   No     | Always 'event' (added by loader)                 |
| timestamp | number   |   No     | Loader timestamp (added by loader)               |

---

## Example Directory Structure

```
modules/
  user/
    events/
      userCreated.event.js
      userUpdated.event.js
  system/
    events/
      multi.event.js
```

---

## See Also
- [pubsub-loader.md](./pubsub-loader.md)
- [json-loader.md](./json-loader.md)
- [service-loader.md](./service-loader.md) 