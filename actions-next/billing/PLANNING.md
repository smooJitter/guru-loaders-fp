# Billing Action Network Reengineering Plan

## Context

- Use the structure and decisions in `PLANNING.md` and `GOLDEN_RULES.md`.
- This plan is for both human and AI contributors, with prompts and questions at each phase.

---

## Step 1: Archive Existing Actions

- Move all files from `actions-next/billing/` to `actions-next/billing-archived-YYYYMMDD/`.
- Confirm no data loss (verify archive contents).
- Prompt: "Is the archive complete and accessible?"

## Step 2: Scaffold Modular Structure

For each subfeature (customer, invoice, payment-method, plan, subscription, stripe):

- Create `<subfeature>-query.actions.js`, `<subfeature>-mutation.actions.js`, `<subfeature>-bulk.actions.js` (if needed), and `lib/`, `__tests__/`, `validation.js`.
- Add barrel exports to all action files
- Integrate withNamespace for all default exports
- Ensure all actions are pure and composable
- Add JSDoc to all actions, utilities, and validation schemas
- Use Ramda and ramda-adjunct for data safety and checks
- Move validation to lib/ and use in actions (schemas expanded and in use)
- Add edge-case and failure-path tests for validation
- Ensure all error messages are standardized and tested
- Document all business rules and non-obvious logic with # Reason: comments
- Add a section for "Migration/Deprecation Notes"
- Prompt: "Are all required files and folders present? Are all exports, validation, and documentation patterns in place?"

## Step 3: Testing

- For each action, create at least 3 tests in `__tests__/` (happy, edge, fail).
- Mock context/services.
- Prompt: "Do all actions have happy, edge, and fail tests? Are context/services mocked? Are error and edge cases covered?"

## Step 4: Documentation

- Update this plan as steps are completed.
- Update or create README for billing module
- Add a section for "Migration/Deprecation Notes"
- Add unresolved questions/complexities here.
- Prompt: "Is documentation up to date and clear for future contributors? Are migration notes and business rules documented?"

## Step 5: Error Handling & Review

- If a step fails, invoke the "micro senior Q&A" module to resolve.
- Prompt: "If an error or ambiguity arises, what is the best-practice resolution?"
- Prompt: "Are there any missing or unclear business rules? Any integration points with other modules? Any performance or scalability concerns? Any ambiguity in validation requirements? Any uncertainty about audit logging granularity? Any potential race conditions or transactional integrity issues?"

---

## Migration/Deprecation Notes

- All legacy billing actions are archived.
- All new actions are modular, composable, context-injected, and robustly tested.
- Context mocks are now in __mocks__ and all tests pass cleanly.
- No direct use of builder, db, or pubsub remains in any module.
- All business rules and non-obvious logic are documented with # Reason: comments.

---

_Composability and purity review is required; Ramda/ramda-adjunct integration must be standardized._ 