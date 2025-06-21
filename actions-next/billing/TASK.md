# TASK: Billing Action Network Modernization

## Goal
Refactor and modernize the billing actions network for modularity, composability, robust testability, and strict adherence to project/global rules.

---

## Checklist

- [ ] Archive legacy billing actions (move to `billing-archived-YYYYMMDD/`)
- [ ] Scaffold modular structure for each subfeature:
  - customer, invoice, payment-method, plan, subscription, stripe
- [ ] Add barrel exports to all action files
- [ ] Integrate action audit utility
- [ ] Integrate withNamespace for all default exports
- [ ] Ensure all actions are pure and composable
- [ ] Add JSDoc to all actions, utilities, and validation schemas
- [ ] Use Ramda and ramda-adjunct for data safety and checks
- [ ] Move validation to `lib/` and use in actions (schemas expanded and in use)
- [ ] Add edge-case and failure-path tests for validation
- [ ] Scaffold `__tests__` with at least 3 tests per action (happy, edge, fail)
- [ ] Mock context/services in all tests
- [ ] Ensure all error messages are standardized and tested
- [ ] Document all business rules and non-obvious logic with `# Reason:` comments
- [ ] Update or create README for billing module
- [ ] Add a section for "Migration/Deprecation Notes"
- [ ] Update documentation (`README.md`, `PLANNING.md`, `TASK.md`)

---

## Performance Criteria

- All actions are modular, testable, and standards-compliant
- No file exceeds 500 lines
- All actions are auditable and documented
- All tests pass with mocked context/services
- No direct use of builder, db, or pubsub in modules

---

## Discovered During Work

- [ ] Track integration points with analytics, user-credits, and other modules
- [ ] Document any new business rules or edge cases

---

## Next Steps

- [ ] Finalize migration/deprecation notes
- [ ] Update or create README for billing module
- [ ] Coordinate integration with analytics, user-credits, and other modules
- [ ] Conduct performance and scalability review
- [ ] Ongoing review of audit utility integration and logging granularity
- [ ] Continue to update documentation as new lessons or patterns emerge 