# TASK: Billing Customer Actions

## Goal
Implement and maintain all customer-related billing actions in a modular, composable, and testable manner.

---

## Files & Tasks

### billing-customer-mutation.actions.js
- [ ] Review and refactor for modularity, composability, and context-injection
- [ ] Integrate withNamespace for default export
- [ ] Ensure all actions are pure and context-injected
- [ ] Add/expand validation in `validation.js`
- [ ] Add/expand JSDoc and # Reason: comments
- [ ] Add at least 3 tests per action (happy, edge, fail, error, pagination) in `__tests__/`
- [ ] Mock context/services in all tests
- [ ] Standardize error messages and test them
- [ ] Document business rules and edge cases

### billing-customer-query.actions.js
- [ ] Review and refactor for modularity, composability, and context-injection
- [ ] Integrate withNamespace for default export
- [ ] Ensure all actions are pure and context-injected
- [ ] Add/expand validation in `validation.js`
- [ ] Add/expand JSDoc and # Reason: comments
- [ ] Add at least 3 tests per action (happy, edge, fail, error, pagination) in `__tests__/`
- [ ] Mock context/services in all tests
- [ ] Standardize error messages and test them
- [ ] Document business rules and edge cases

### billing-customer-bulk.actions.js (if needed)
- [ ] Scaffold and implement if bulk operations are required
- [ ] Follow the same standards as above

---

## General Checklist
- [ ] Add barrel exports to all action files
- [ ] Update README and documentation as needed

---

## Discovered During Work
- [ ] Document any new business rules or edge cases
- [ ] Track integration points with other billing submodules 