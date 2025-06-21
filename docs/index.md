# Documentation Index

Welcome to the documentation for the Guru-Loader-FP project. Below is a list of available documentation files:

- [README](README.md): Project overview and setup instructions.
- [Patterns](patterns.md): General patterns used in the project.
- [Actions and Resolver Composition Patterns](patterns/actions_resolvercomposer.md): Patterns for actions and resolver composition.
- [Models and TypeComposer Patterns](patterns/models_typecomposer.md): Patterns for models and TypeComposer.
- [Guru Loader FP Patterns](patterns/guru_loader_fp.md): Specific patterns for the Guru-Loader-FP project.

Feel free to explore each document to understand the project's architecture and design patterns. 

---

## Test Coverage & Reliability Standards (2024)

- **Branch coverage:** 80%+ project-wide, with most core modules at 90–100%.
- **Defensive coding:** All utilities and loaders now validate input and handle null/undefined/invalid arguments gracefully.
- **Error handling:** All async logic is wrapped with robust error handling and logging, with fallbacks for missing loggers.
- **Testing:** Every module, guard, and utility has comprehensive tests for happy, edge, and failure paths.
- **Reliability:** The codebase is now highly resilient to unexpected input and runtime errors, with clear test evidence.

## Archived Modules

- [loader-core (archived 2024-06-12)](_archived/loader-core-archived-20240612.md) 