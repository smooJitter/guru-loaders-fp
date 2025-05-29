# Core Module

The `src/core/` directory provides the foundational architecture for the `guru-loaders-fp` framework. It defines how application context is created, validated, and composed, and how loader pipelines are orchestrated.

---

## 🏗️ Core Responsibilities

- **Context Creation**: Centralizes all configuration, services, registries, and request-scoped data.
- **Validation**: Ensures all required services, registries, and configuration are present and valid.
- **Pipeline Orchestration**: Composes and executes loader pipelines to build up the application context.
- **Request Handling**: Provides per-request context and validation for safe, multi-tenant, or user-specific operations.

---

## 📦 Main Components

### 1. Context (`context/`)

- **create-context.js**: 
  - `createContext(defaults, services)`: Builds the base application context, merging defaults, services, registries, and watcher state.
  - `createRequestContext(baseContext, request)`: Produces a per-request context, injecting user, tenant, and request data.

- **validate-context.js**:
  - `createValidationPipeline(options)`: Returns a pipeline that checks for required services, registries, environment, and config.
  - `createRequestValidationPipeline()`: Validates the shape and presence of user, tenant, and request in the context.

---

### 2. Pipeline (`pipeline/`)

- **create-pipeline.js**:
  - `createLoader(type, options)`: Factory for building loader pipelines. Handles file discovery, module loading, validation, dependency checks, and context updates.
  - Supports plugin hooks (`before`, `after`) and hot reload (where implemented).

---

### 3. Core Entrypoint (`index.js`)

- **createApp(options)**: 
  - Sets up the base context, validation pipeline, and all core loaders (models, types, actions, resolvers, routes).
  - Returns an `app` function (to build the full context) and a `handleRequest` function (to create and validate per-request context).

---

## 🧩 Example: Creating an App

```js
import { createApp } from './core';

const { app, handleRequest } = createApp({
  defaults: { config: { ... } },
  services: { db: myDb, pubsub: myPubSub },
  plugins: [/* ... */]
});

const context = await app();
const requestContext = await handleRequest({ user, tenant, ...req });
```

---

## 🧪 Testing

- Test context creation and validation in isolation.
- Mock services and registries for unit tests.
- Validate that missing or invalid context is caught early.

---

## ✅ Best Practices

- Always use the context factories for creating and extending context.
- Use validation pipelines to enforce required structure.
- Compose all loader logic through the pipeline utilities for consistency and extensibility.

---

## 📚 References

- See `context/` for context and validation logic.
- See `pipeline/` for loader orchestration.
- See `index.js` for the main application entrypoint and composition. 