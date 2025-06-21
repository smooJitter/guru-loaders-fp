# billing/subscription

## Status
✅ All actions, validation, and tests complete and passing as of 2024-06-09. 100% coverage.

## Purpose
This submodule manages all subscription-related billing logic, including subscription creation, updates, retrieval, and integration with external billing providers.

## Structure
- `subscription-query.actions.js` — Query actions for retrieving subscription data
- `subscription-mutation.actions.js` — Mutation actions for creating/updating subscriptions
- `subscription-bulk.actions.js` — Bulk operations (if needed)
- `lib/` — Shared utilities and guard HOFs for subscription actions
- `__tests__/` — Unit tests for all actions and utilities
- `validation.js` — Yup schemas for validating subscription input

## Standards
- All actions are pure, composable, and context-injected (no direct db, builder, or pubsub usage)
- Validation is handled via schemas in `validation.js`
- At least 3 tests per action (happy, edge, fail), with context/services mocked
- All business rules and non-obvious logic are documented with `# Reason:` comments
- All filenames must match the canonical pattern: `subscription-query.actions.js`, `subscription-mutation.actions.js`, and (if needed) `subscription-bulk.actions.js` (matching the archived originals)
- Maintain 100% coverage and documentation for all new and changed code. The test suite should serve as a reference for defensive and composable testing.
- Follow naming, export, and folder conventions in the parent README and `GLOBAL_RULES.md`

## Testing
- All actions have at least 3 tests (happy, edge, fail)
- Context, models, and services are fully mocked in all tests
- Defensive and composable test patterns are used throughout
- 100% coverage for all action and validation files

## Progress
- See `TASK.md` for per-file and per-feature status tracking

## Extending
- Add new actions by following the `withNamespace` pattern
- Update validation and tests accordingly
- Maintain 100% coverage and documentation for all new and changed code
- Document any new business rules or edge cases in both code and `TASK.md`
- Track per-file progress in `TASK.md`

---

See parent README for global billing architecture and standards. 