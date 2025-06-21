# PLANNING.md — loader-core

> **NOTE: This module is archived as of 2024-06-12. All new loader development must use `loader-core-new`.**
> - Archived source: `src/core/loader-core/_archived_20240612/`
> - New core: `src/core/loader-core/loader-core-new/`

## Vision
- Provide a pure, functional, and explicit loader orchestration toolkit.
- Registry builders must be pure; all transforms/context/validation are explicit steps before registry construction.

## Key Principles
- No transforms in registry builders.
- Loader pipeline is explicit: discovery → import/context → validation → registry build → assignment.
- Registry strategy is set by the developer, not by transforms.
- Documentation and tests must reflect the new flow.

## Current Focus
- Refactor to remove legacy transform usage.
- Centralize registry builders in `lib/registry-builders.js`.
- Document and enforce explicit loader configuration.

## Open Questions
- [ ] Should we support directory-based module loading natively?
- [ ] How to handle legacy loader compatibility?

## References
- See `README.md` for API and usage. 

---

## Refactoring Strategy by File

### Main Directory
- **index.js**: _Keep minimal._ Only re-export public API. No logic.
- **loader.js**: _Refactor._ Ensure explicit, stepwise loader pipeline. Remove transform usage from registry step.
- **loader-async.js**: _Refactor._ Align with loader.js; ensure async pipeline is explicit and pure.
- **registry.js**: _Refactor/Migrate._ Move registry builder logic to `lib/registry-builders.js`. Keep only orchestration or legacy compatibility if needed.
- **transforms.js**: _Deprecate/Legacy only._ Remove from main pipeline. Retain for legacy support and document as such.
- **plugins.js**: _Keep._ Ensure only plugin/middleware logic. No registry or transform logic.
- **README.md**: _Update._ Reflect new loader pipeline, registry builder purity, and explicit configuration.
- **LOADER_CORE_COVERAGE.md**: _Keep updated._ Ensure test coverage reflects new code structure.
- **TASK.md**: _Maintain._ Track actionable tasks and discoveries.
- **PLANNING.md**: _Maintain._ Keep architectural vision and strategy up to date.

### lib/
- **registry-builders.js**: _Centralize._ All pure registry builder functions live here. This is now the single source of truth for registry structures/strategies. Add tests.
- **registry-strategy.js**: _Deprecate/Remove._ No longer needed; logic has been consolidated into registry-builders.js.
- **registry-introspection.js**: _Keep._ For registry inspection/debug utilities. Add tests if missing.

### _archived/
- **srtas.js**: _Archive._ No active maintenance. Migrate any useful logic to main codebase or delete if obsolete. 