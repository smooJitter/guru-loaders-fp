# billing/payment-method

## Purpose
This submodule manages all payment-method-related billing logic, including adding, updating, and removing payment methods, and integration with external billing providers.

## Structure
- `payment-method-query.actions.js` — Query actions for retrieving payment method data
- `payment-method-mutation.actions.js` — Mutation actions for adding/updating/removing payment methods
- `payment-method-bulk.actions.js` — Bulk operations (if needed)
- `lib/` — Shared utilities and guard HOFs for payment-method actions
- `__tests__/` — Unit tests for all actions and utilities
- `validation.js` — Yup schemas for validating payment method input

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