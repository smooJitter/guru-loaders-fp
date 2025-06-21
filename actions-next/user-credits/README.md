# user-credits Module

## Purpose & Scope
The `user-credits` module manages all credit-related logic for users, including transactions, analytics, and account management. It is designed for modularity, composability, and robust testability, supporting both human and AI contributors.

---

## Key Architectural Rules
- **Modularity:** Each subfeature (transactions, analytics, account) is isolated in its own folder with actions, validation, and tests.
- **Composability:** All actions are pure, composable functions, exported via the `withNamespace` utility.
- **Context Injection:** No direct use of builder, db, or pubsub—always use `context.services` and `context.models`.
- **Auditability:** All privileged actions are auditable via the action audit utility and meta tags.
- **Validation:** All input is validated using shared yup schemas; context is never validated.
- **Testing:** Every action, model, and guard has at least 3 tests (happy, edge, fail), with robust mocking and composability checks.
- **Documentation:** All business rules and non-obvious logic are documented with `# Reason:` comments and JSDoc.

---

## Directory Structure
```
user-credits/
├── transactions/
│   ├── user-credits-transactions-query.actions.js
│   ├── user-credits-transactions-mutation.actions.js
│   ├── user-credits-transactions-bulk.actions.js
│   ├── lib/
│   ├── __tests__/
│   └── validation.js
├── analytics/
│   └── ...
├── account/
│   └── ...
├── PLANNING.md
├── TASK.md
├── TESTING.md
└── README.md
```

---

## Using & Extending Actions
- **Import actions via default export and extract by name:**
  ```js
  import actions from './transactions/user-credits-transactions-mutation.actions.js';
  const creditTopUp = actions.find(a => a.name === 'creditTopUp').method;
  ```
- **Call actions with an object:** `{ context, ...fields }`
- **Context must include:**
  - `services` (e.g., db, pubsub)
  - `user` (id, roles)
  - `tenant` (id)
  - `models` (mocked or real, depending on environment)
- **To add new actions:**
  - Follow the `withNamespace` pattern for default exports
  - Add validation schemas in `validation.js`
  - Add at least 3 tests in `__tests__/`
  - Document any business rules or non-obvious logic

---

## Running Tests & Checking Coverage
- Run all tests:
  ```sh
  npx jest actions-next/user-credits --runInBand
  ```
- Run a specific test file:
  ```sh
  npx jest actions-next/user-credits/transactions/__tests__/user-credits-transactions-mutation.actions.test.js --runInBand
  ```
- Check coverage:
  ```sh
  npx jest --coverage
  ```
- Coverage thresholds: 80%+ required for statements, branches, lines, and functions.

---

## Documentation & Onboarding
- **Planning:** See [`PLANNING.md`](./PLANNING.md)
- **Tasks & Progress:** See [`TASK.md`](./TASK.md)
- **Testing standards:** See [`TESTING.md`](./TESTING.md)
- **Global rules:** See [`../../GLOBAL_RULES.md`](../../GLOBAL_RULES.md)

---

## Migration/Deprecation Notes
- All legacy user-credits/account actions are archived.
- All new account actions are modular, composable, context-injected, and robustly tested.
- Context mocks are now in __mocks__ and all tests pass cleanly.
- No direct use of builder, db, or pubsub remains in any module.
- All business rules and non-obvious logic are documented with # Reason: comments.

---

## Contribution & Contact
- All contributors (human or AI) must follow the standards in `PLANNING.md`, `TASK.md`, and `GLOBAL_RULES.md`.
- If you encounter ambiguity, document it in `TASK.md` and/or raise it with the maintainers.
- For questions, see the module lead or open an issue in the main repo.

---

_Last updated: 2024-06-10_ 