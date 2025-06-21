# User-Credits Action Network Reengineering Plan

## Context
- Use the structure and decisions in `PLANNING.md` and `GOLDEN_RULES.md`.
- This plan is designed for both human and AI contributors to follow stepwise, with prompts and questions at each phase.

---

## Step 1: Archive Existing Actions
- [x] Move all files from `actions-next/user-credits/` to `actions-next/user-credits-archived-YYYYMMDD/`.
- [x] Confirm no data loss (verify archive contents).
- Prompt: "Is the archive complete and accessible?"

## Step 2: Scaffold Modular Structure
- For each subfeature (transactions, analytics, account):
  - [x] Create `user-credits-<subfeature>-query.actions.js`, `user-credits-<subfeature>-mutation.actions.js`, `user-credits-<subfeature>-bulk.actions.js` (if needed), and `lib/`, `__tests__/`, `validation.js`.
  - [x] Add barrel exports to all action files
  - [x] Integrate withNamespace for all default exports
  - [x] Ensure all actions are pure and composable
  - [x] Add JSDoc to all actions, utilities, and validation schemas
  - [x] Use Ramda and ramda-adjunct for data safety and checks
  - [x] Move validation to lib/ and use in actions (schemas expanded and in use)
  - [x] Add edge-case and failure-path tests for validation
  - [x] Ensure all error messages are standardized and tested
  - [x] Document all business rules and non-obvious logic with # Reason: comments
  - [ ] Add a section for "Migration/Deprecation Notes"
- Prompt: "Are all required files and folders present? Are all exports, validation, and documentation patterns in place?"

## Step 3: Testing
- For each action, create at least 3 tests in `__tests__/` (happy, edge, fail).
- [x] Mock context/services.
- Prompt: "Do all actions have happy, edge, and fail tests? Are context/services mocked? Are error and edge cases covered?"

## Step 4: Documentation
- [x] Update this plan as steps are completed.
- [ ] Update or create README for user-credits module
- [ ] Add a section for "Migration/Deprecation Notes"
- [x] Add unresolved questions/complexities here.
- Prompt: "Is documentation up to date and clear for future contributors? Are migration notes and business rules documented?"

## Step 5: Error Handling & Review
- If a step fails, invoke the "micro senior Q&A" module to resolve.
- Prompt: "If an error or ambiguity arises, what is the best-practice resolution?"
- Prompt: "Are there any missing or unclear business rules? Any integration points with other modules? Any performance or scalability concerns? Any ambiguity in validation requirements? Any uncertainty about audit logging granularity? Any potential race conditions or transactional integrity issues?"

## Completed Steps
- user-credits-transactions-mutation.actions.js: Complete
- user-credits-transactions-query.actions.js: Complete
- user-credits-transactions-bulk.actions.js: Complete
- user-credits-analytics-mutation.actions.js: Complete
- user-credits-analytics-query.actions.js: Complete
- user-credits-account-mutation.actions.js: Complete
- user-credits-account-query.actions.js: Complete
- user-credits-account-bulk.actions.js: Complete

## Migration/Deprecation Notes
- All legacy user-credits/account actions are archived.
- All new actions are modular, composable, context-injected, and robustly tested.
- Context mocks are now in __mocks__ and all tests pass cleanly.
- No direct use of builder, db, or pubsub remains in any module.
- All business rules and non-obvious logic are documented with # Reason: comments.

## Checklist
- [x] Archive complete
- [x] Scaffolded new structure
- [x] Barrel exports in place
- [x] Integrate action audit utility
- [x] Integrate withNamespace for all default exports
- [x] Ensure all actions are pure and composable
- [x] Add JSDoc to all actions, utilities, and validation schemas
- [x] Use Ramda and ramda-adjunct for data safety and checks
- [x] Move validation to lib/ and use in actions (schemas expanded and in use)
- [x] Add edge-case and failure-path tests for validation
- [x] Scaffold __tests__ with at least 3 tests per action (happy, edge, fail)
- [x] Mock context/services in all tests
- [x] Ensure all error messages are standardized and tested
- [x] Document all business rules and non-obvious logic with # Reason: comments
- [x] Update or create README for user-credits module
- [x] Add a section for "Migration/Deprecation Notes"
- [x] Update documentation (README, PLANNING.md, TASK.md)

---

_Composability and purity review is complete; Ramda/ramda-adjunct integration is now standardized._ 