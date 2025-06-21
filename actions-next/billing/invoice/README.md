# billing/invoice

## Purpose
This submodule manages all invoice-related billing logic, including invoice creation, updates, retrieval, and integration with external billing providers.

## Structure
- `billing-invoice-query.actions.js` — Query actions for retrieving invoice data
- `billing-invoice-mutation.actions.js` — Mutation actions for creating/updating invoices
- `billing-invoice-bulk.actions.js` — Bulk operations (if needed)
- `lib/` — Shared utilities and guard HOFs for invoice actions
- `__tests__/` — Unit tests for all actions and utilities
- `validation.js` — Yup schemas for validating invoice input

## Standards
- All actions are pure, composable, and context-injected (no direct db, builder, or pubsub usage)
- Validation is handled via schemas in `validation.js`
- At least 3 tests per action (happy, edge, fail), with context/services mocked
- All business rules and non-obvious logic are documented with `# Reason:` comments
- Follow naming, export, and folder conventions in the parent README and `GLOBAL_RULES.md`
- **Comprehensive test coverage:** All actions are covered by happy, edge, fail, error, and pagination tests, following the patterns in `TESTING.md`. Coverage is 95%+ for statements, branches, and functions.
- **Integration points:** Ongoing integration with other billing submodules and external providers is tracked in `TASK.md`.

## Extending
- Add new actions by following the `withNamespace` pattern
- Update validation and tests accordingly
- Document any new business rules or edge cases in both code and `TASK.md`
- Update this README as new patterns or integration points emerge

---

See parent README for global billing architecture and standards. 