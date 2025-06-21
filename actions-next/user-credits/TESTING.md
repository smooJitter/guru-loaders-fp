# TESTING.md

_Authoritative guide for testing the `user-credits` module and submodules._

---

## 🛠️ Key Testing Challenges Overcome

During the reengineering of `user-credits`, several important testing challenges were identified and resolved. Understanding these will help future contributors avoid common pitfalls:

- **Context Injection:**
  - Early tests failed due to missing or malformed `context` objects. All tests now use a robust `mockContext` that includes `services`, `user`, `tenant`, and `models`.
- **withNamespace Import Pattern:**
  - Actions are exported as an array of objects via `withNamespace`, not as named exports. Tests must import the default export and extract each action's `.method` by name.
- **Validation Schema Pitfalls:**
  - Validation schemas originally required `context` as a field, causing errors when actions extracted `context` before validation. Schemas now only validate business/data fields, never `context`.
- **Mocking Robustness:**
  - All models and services are mocked per test, and defensive assertions are used to catch missing or malformed context/models early.
- **Composability:**
  - Tests demonstrate that actions can be composed (e.g., top up then spend) to ensure functional purity and module interoperability.
- **Debugging Approach:**
  - Console logging and defensive checks were used to quickly identify import, export, and input shape issues.

These lessons are now codified in the patterns and requirements below. If you encounter similar issues, review this section and the examples provided.

---

## 📚 Context & Scope
- **This file applies to:** `user-credits/transactions`, `user-credits/account`, `user-credits/analytics`, and all subfolders.
- **Always read [`PLANNING.md`](./PLANNING.md) and [`TASK.md`](./TASK.md) for architectural and process context.**

---

## 🧪 Test Coverage Requirements
- **Every action, model, and guard must have at least 3 tests:**
  - ✅ Happy path (expected/valid input)
  - ❓ Edge case (boundary, zero, empty, etc.)
  - ❌ Failure/rejection (invalid input, unauthorized, insufficient, etc.)
- **Tests must live in `__tests__/` folders** matching the module structure.
- **All guards must be tested for both pass and fail conditions.**
- **Composability:** At least one test should demonstrate composing multiple actions (e.g., top up then spend).

---

## 🧱 Test Structure & Patterns

### 1. **Mocking Context, Models, and Services**
- **Never use real DB or external services in unit tests.**
- **Mock context** should always include:
  ```js
  const mockContext = () => ({
    services: {},
    user: { id: 'test-user', roles: ['USER'] },
    tenant: { id: 'test-tenant' },
    models: {
      /* ...mocked model methods... */
    },
  });
  ```
- **Mock models** should provide only the methods needed for the test (e.g., `findOneAndUpdate`, `create`).
- **Override mocks per test** to simulate edge/failure conditions.

### 2. **Testing Actions Exported via `withNamespace`**
- **Import the default export** and extract methods by name:
  ```js
  import actions from '../user-credits-transactions-mutation.actions.js';
  const creditTopUp = actions.find(a => a.name === 'creditTopUp').method;
  ```
- **Call actions with an object:** `{ context, ...fields }`

### 3. **Test File Example**
```js
import actions from '../user-credits-transactions-mutation.actions.js';
const creditTopUp = actions.find(a => a.name === 'creditTopUp').method;
const mockContext = () => ({ /* ... */ });

describe('creditTopUp', () => {
  it('should top up credits (happy path)', async () => {
    const context = mockContext();
    const result = await creditTopUp({ context, userId: 'u1', amount: 50 });
    expect(result).toBe(100);
  });
  it('should fail with missing userId (failure path)', async () => {
    const context = mockContext();
    await expect(creditTopUp({ context, amount: 50 })).rejects.toThrow();
  });
  // ...
});
```

---

## 🏗️ Adding New Tests
- Place new test files in the appropriate `__tests__/` folder.
- Use the patterns above for context and action extraction.
- **Name test files** as `<feature>-<type>.test.js` (e.g., `user-credits-transactions-mutation.actions.test.js`).
- **Update this file** if you introduce new testing conventions or patterns.

---

## 🚦 Running Tests & Coverage
- Run all tests for this module:
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
- **Coverage thresholds:** 80%+ required for statements, branches, lines, and functions.

---

## ⚠️ Module-Specific Gotchas
- **withNamespace:** Always extract `.method` from the action object.
- **Validation:** Only business/data fields are validated; `context` is handled separately.
- **Mocks:** Defensive assertions are recommended to catch missing/malformed context or models.
- **Composability:** Test that actions can be composed in sequence (e.g., top up then spend).

---

## 🤖 AI Contributor Guidance
- **Do NOT generate tests that use real services or DB.**
- **Do NOT assume context shape—always mock as above.**
- **If unsure about a test scenario, ask for clarification or check PLANNING.md.**
- **Always update this file if you introduce new test patterns.**

---

## 📎 References
- [`PLANNING.md`](./PLANNING.md)
- [`TASK.md`](./TASK.md)
- [`GLOBAL_RULES.md`](../../GLOBAL_RULES.md)

---

_Last updated: 2024-06-09_ 