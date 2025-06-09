# Archived Core Context Management & Modular System

This folder contains the legacy, modular core system for app context management and orchestration. It is preserved for reference, inspiration, or possible future use.

## What is Archived Here?
- **`index.js`**: The original core entrypoint, responsible for app creation, context setup, validation, and loader orchestration.
- **`context/`**: Factories and pipelines for building and validating application/request context.
- **`steps/`**: Experimental modular pipeline steps for loader composition.

## Intentions & Design
- Provide a single source of truth for all app context (config, services, registries, user, tenant, etc.).
- Enforce context and validation best practices at the core level.
- Enable modular, composable pipelines for loading and processing app modules.
- Allow for future extension via plugins, hooks, or custom steps.

## Why is it Archived?
- The current app uses a new, direct loader system (`core/pipeline/create-pipeline.js`) that does not depend on this modular context system.
- No active code imports or uses these files.
- This system is MVP-ready and can be revived or adapted for future projects that need more explicit or extensible context management.

## How to Reuse or Revive
- Update the archived files to use the latest loader pipeline and service injection patterns.
- Integrate context creation and validation into the main app bootstrap and request flow.
- Consider extracting or reusing the modular step pattern for new pipelines.

---

**This archive preserves a clean, functional foundation for advanced context management and modular orchestration in future apps.** 