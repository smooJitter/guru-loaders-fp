# billing/stripe

## Status
✅ All core actions, validation, and tests scaffolded and modernized as of 2024-06-09.
✅ As of 2024-06-10: All Stripe actions, validation, and tests are fully modernized, 100% covered, and compliant with all standards. All sanitize helpers are exported for direct testing. All tests pass and coverage is 100% for all files.

## Purpose
This submodule manages all Stripe integration logic, including customer, payment, plan, and subscription sync with Stripe APIs.

## Structure
- `stripe-query.actions.js` — Query actions for retrieving Stripe-related data
- `stripe-mutation.actions.js` — Mutation actions for creating/updating Stripe resources
- `stripe-bulk.actions.js` — Bulk operations (if needed)
- `lib/` — Shared utilities and guard HOFs for Stripe actions
- `__tests__/` — Unit tests for all actions and utilities
- `validation.js` — Yup schemas for validating Stripe input

## Standards
- All actions are pure, composable, and context-injected (no direct db, builder, or pubsub usage)
- Validation is handled via schemas in `validation.js`
- At least 3 tests per action (happy, edge, fail), with context/services mocked
- All business rules and non-obvious logic are documented with `# Reason:` comments
- Follow naming, export, and folder conventions in the parent README and `GLOBAL_RULES.md`

## Testing
- All actions have at least 3 tests (happy, edge, fail)
- Context, models, and services are fully mocked in all tests
- Defensive and composable test patterns are used throughout
- 100% coverage is targeted for all action and validation files

## Progress
- See `TASK.md` for per-file and per-feature status tracking

## Extending
- Add new actions by following the `withNamespace` pattern
- Update validation and tests accordingly
- Document any new business rules or edge cases in both code and `TASK.md`

---

See parent README for global billing architecture and standards. 