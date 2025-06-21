# billing/plan

## Purpose
This submodule manages all plan-related billing logic, including plan creation, updates, retrieval, and integration with external billing providers.

## Structure
- `plan-query.actions.js` — Query actions for retrieving plan data
- `plan-mutation.actions.js` — Mutation actions for creating/updating plans
- `plan-bulk.actions.js` — Bulk operations (if needed)
- `lib/` — Shared utilities and guard HOFs for plan actions
- `__tests__/` — Unit tests for all actions and utilities
- `validation.js` — Yup schemas for validating plan input

## Standards
- All actions are pure, composable, and context-injected (no direct db, builder, or pubsub usage)
- Validation is handled via schemas in `validation.js`
- At least 3 tests per action (happy, edge, fail), with context/services mocked
- All business rules and non-obvious logic are documented with `# Reason:` comments
- Query actions are covered 100% for statements, branches, functions, and lines—including rare/null/edge cases. This coverage must be maintained for all future changes.
- Follow naming, export, and folder conventions in the parent README and `GLOBAL_RULES.md`

## Extending
- Add new actions by following the `withNamespace` pattern
- Update validation and tests accordingly
- Maintain 100% coverage for all new and changed code (see test suite for defensive and composable testing reference)
- Document any new business rules or edge cases in both code and `TASK.md`

---

See parent README for global billing architecture and standards. 