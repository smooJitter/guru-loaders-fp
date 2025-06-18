# Core (Minimal)

This directory contains the active core pipeline loader for the app.

- **pipeline/create-pipeline.js**: The main factory for building loader pipelines. Handles file discovery, module loading, validation, dependency checks, and context updates for all app modules.

All legacy context, validation, and modular step logic has been archived in `_archive/` for future reference.

# core/

This directory contains foundational utilities and core modules for the project.

## loader-core

The `loader-core` subdirectory contains a modern, modular toolkit for building robust, pipeline-friendly loaders and registries. All loader utilities, transforms, plugins, and registry strategies now live in `core/loader-core`.

**Import example:**
```js
import { createFunctionalLoader } from './core/loader-core';
```

See `core/loader-core/README.md` for full documentation and usage examples. 