# TASK: Billing Payment-Method Actions

## Goal
Implement and maintain all payment-method-related billing actions in a modular, composable, and testable manner.

---

## Checklist
- [ ] Scaffold action files: `payment-method-query.actions.js`, `payment-method-mutation.actions.js`, `payment-method-bulk.actions.js` (if needed)
- [ ] Add barrel exports to all action files
- [ ] Integrate withNamespace for all default exports
- [ ] Ensure all actions are pure and context-injected
- [ ] Add/expand validation in `validation.js`
- [ ] Add JSDoc and # Reason: comments
- [ ] Add at least 3 tests per action (happy, edge, fail) in `__tests__/`
- [ ] Mock context/services in all tests
- [ ] Standardize error messages and test them
- [ ] Document business rules and edge cases
- [ ] Update README and documentation as needed

---

## Discovered During Work
- [ ] Document any new business rules or edge cases
- [ ] Track integration points with other billing submodules 