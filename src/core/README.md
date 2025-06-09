# Core (Minimal)

This directory contains the active core pipeline loader for the app.

- **pipeline/create-pipeline.js**: The main factory for building loader pipelines. Handles file discovery, module loading, validation, dependency checks, and context updates for all app modules.

All legacy context, validation, and modular step logic has been archived in `_archive/` for future reference. 