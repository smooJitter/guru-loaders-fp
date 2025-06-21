# billing/customer

## Purpose
This submodule manages all customer-related billing logic, including customer creation, updates, retrieval, and integration with external billing providers (e.g., Stripe).

## Structure
- `customer-query.actions.js` — Query actions for retrieving customer data
- `customer-mutation.actions.js` — Mutation actions for creating/updating customers
- `customer-bulk.actions.js` — Bulk operations (if needed)
- `lib/` — Shared utilities and guard HOFs for customer actions
- `__tests__/` — Unit tests for all actions and utilities
- `validation.js` — Yup schemas for validating customer input

## Standards
- All actions are pure, composable, and context-injected (no direct db, builder, or pubsub usage)
- Validation is handled via schemas in `validation.js`
- At least 3 tests per action (happy, edge, fail), with context/services mocked
- All business rules and non-obvious logic are documented with `# Reason:` comments
- Follow naming, export, and folder conventions in the parent README and `GLOBAL_RULES.md`

## Extending
- Add new actions by following the `withNamespace` pattern
- Update validation and tests accordingly
- Document any new business rules or edge cases in both code and `TASK.md`

---

See parent README for global billing architecture and standards. 