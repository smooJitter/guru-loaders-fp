# PLANNING.md: Migration to `actions-next/`

## 1. Migration Goals and Principles
- **Modularity:** Organize actions by feature and sub-feature for clarity and maintainability.
- **Scalability:** Support deep nesting for complex domains.
- **Consistency:** Use the pattern `<scope>-<entity>-<actiontype>.actions.js` for all action files (e.g., `event-song-swipe-query.actions.js`), even within nested folders. Avoid generic names like `query.actions.js` to prevent collisions and support file mobility.
- **Minimal Boilerplate:** Prefer `withNamespace` for namespacing; use `index.js` only for advanced composition.
- **Loader Simplicity:** Loader should auto-discover all `.actions.js` files recursively.
- **Testability:** All actions must be easily mockable and testable.

## 2. Proposed File Structure

```
actions-next/
  user/
    user-query.actions.js
    user-mutation.actions.js
    user-account-query.actions.js
    user-account-mutation.actions.js
    user-profile-query.actions.js
    user-profile-mutation.actions.js
  event/
    event-query.actions.js
    event-mutation.actions.js
    event-bulk.actions.js
    event-analytics.actions.js
  event-music/
    song-swipe/
      event-song-swipe-query.actions.js
      event-song-swipe-mutation.actions.js
      event-song-swipe-analytics.actions.js
    song-request/
      event-song-request-query.actions.js
      event-song-request-mutation.actions.js
      event-song-request-analytics.actions.js
    song/
      event-song-query.actions.js
      event-song-mutation.actions.js
      event-song-analytics.actions.js
  user-credits/
    account/
      user-credits-account-query.actions.js
      user-credits-account-mutation.actions.js
      user-credits-account-bulk.actions.js
    transactions/
      user-credits-transactions-query.actions.js
      user-credits-transactions-mutation.actions.js
    analytics/
      user-credits-analytics-query.actions.js
      user-credits-analytics-mutation.actions.js
  billing/
    customer/
      billing-customer-query.actions.js
      billing-customer-mutation.actions.js
      billing-customer-bulk.actions.js
    invoice/
      billing-invoice-query.actions.js
      billing-invoice-mutation.actions.js
    payment-method/
      billing-payment-method-query.actions.js
      billing-payment-method-mutation.actions.js
    plan/
      billing-plan-query.actions.js
      billing-plan-mutation.actions.js
    subscription/
      billing-subscription-query.actions.js
      billing-subscription-mutation.actions.js
    stripe/
      billing-stripe-query.actions.js
      billing-stripe-mutation.actions.js
  analytics/
    user-subscription/
      analytics-user-subscription-query.actions.js
      analytics-user-subscription-mutation.actions.js
    user-cohort/
      analytics-user-cohort-query.actions.js
      analytics-user-cohort-mutation.actions.js
    event-song-intel/
      analytics-event-song-intel-query.actions.js
      analytics-event-song-intel-mutation.actions.js
    event/
      host-analytics/
        analytics-event-host-analytics-query.actions.js
        analytics-event-host-analytics-mutation.actions.js
    billing/
      revenue-analytics/
        analytics-billing-revenue-analytics-query.actions.js
        analytics-billing-revenue-analytics-mutation.actions.js
```

## 3. Recommended .actions.js File Composition

### Preferred Pattern: withNamespace Utility

**All new `.actions.js` files should use the `withNamespace` utility to define actions for a namespace.**

#### Example
```js
// event-song-swipe-query.actions.js
import { withNamespace } from '../../utils/with-namespace.js';

const getSwipes = async ({ context, eventId }) => {
  // ...logic
};

const swipeSong = async ({ context, songId, direction }) => {
  // ...logic
};

export default withNamespace('eventSongSwipe', {
  getSwipes,
  swipeSong: {
    method: swipeSong,
    meta: { audit: true }
  }
});
```

#### Rationale
- **Consistency:** All actions for a namespace are grouped in one place.
- **Mobility:** Files can be moved or reorganized without risk of name collisions.
- **Minimal Boilerplate:** No need to manually construct arrays or objects with namespace/name/method.
- **Meta Support:** Easily attach meta (audit, permissions, etc.) to any action.
- **Loader Compatibility:** The loader will extract the namespace and build the correct `context.actions` structure.
- **Testability:** Actions are plain functions, easy to mock or stub.

#### Migration Guidance
- When migrating legacy actions, refactor to use `withNamespace` where possible.
- Ensure each file exports a single namespace, matching the domain or subdomain of the actions.
- Use meta for audit, cache, permissions, and other behavioral controls as needed.

### Other Supported Patterns (Legacy/Transitional)
- **Factory Export:** Export a function that takes `context` and returns an object of namespaced actions.
- **Array Export:** Export an array of action objects, each with `namespace`, `name`, `method`, and optional `meta`.
- **Object Export:** Export an object keyed by namespace, with each value an object of actions.

> **Note:** These patterns are supported for backward compatibility, but all new code should use the `withNamespace` pattern for clarity and maintainability.

### General Guidelines
- Keep actions focused and small for maintainability.
- All action methods should accept a single object argument, always including `context`.
- Use metadata for audit, caching, permissions, etc.
- See `docs/action-loader-2-examples.md` for more patterns and advanced meta usage.

### Example: user-account-mutation.actions.js with Inline Config/Lib
```js
// user-account-mutation.actions.js

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
  INVALID_ROLE: (role) => `Invalid role: ${role}`,
};

const USER_ROLES = ['admin', 'user', 'guest'];

const sanitizeAccount = (account) => {
  // Logic to sanitize account
  return account;
};

const validateInput = ({ userId, tenantId, prefs, roles, badge, delta }) => {
  if (!userId || (!tenantId && !prefs && !roles && !badge && typeof delta !== 'number')) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
};

const validateRoles = (roles, validRoles) => {
  if (!roles.every((r) => validRoles.includes(r))) {
    throw new Error(ERRORS.INVALID_ROLE(roles.find((r) => !validRoles.includes(r))));
  }
};

// Main action logic using withNamespace
import { withNamespace } from '../../utils/with-namespace.js';

const createAccount = async ({ context, userId, tenantId, roles }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;

  validateInput({ userId, tenantId });
  const account = await new UserAccount({
    userId,
    tenantId,
    roles: roles ?? [USER_ROLES[0]]
  }).save();
  return sanitizeAccount(account.toObject());
};

// Additional action methods...

export default withNamespace('userAccount', {
  createAccount,
  // Other actions...
});
```

## 4. Migration Steps
1. **Create `actions-next/` directory and add folders/files as above.**
2. **Refactor each action file from `actions/` to use `withNamespace` and the new naming pattern.**
3. **Move refactored files to the new structure.**
4. **Update loader configuration to include `actions-next/`.**
5. **Test all actions in the new structure.**
6. **Gradually update application code to use `actions-next/`.**
7. **Deprecate and archive `actions/` after full migration.**

## 5. Naming Conventions
- **Files:** `<scope>-<entity>-<actiontype>.actions.js` (e.g., `event-song-swipe-query.actions.js`, `user-profile-query.actions.js`)
- **Folders:** kebab-case for all feature and subfeature folders (e.g., `event-music/`, `song-swipe/`)
- **Action methods:** camelCase
- **No underscores or dots in folder names except for `.actions.js` suffix**
- **Use `.actions.js` suffix for all action files**

## 6. Loader Configuration
```js
const actionLoader = createActionLoader2({
  patterns: [
    'actions-next/**/*.actions.js',
  ],
});
```

## 7. Testing and Validation Plan
- **Unit tests:** For each action, ensure correct behavior and error handling.
- **Integration tests:** Validate that `context.actions` is correctly composed and accessible.
- **Mock context/services in all tests.**
- **Test both legacy and new actions in parallel during migration.**

## 8. Deprecation Plan for `actions/`
- Mark `actions/` as deprecated in documentation.
- Remove or archive `actions/` after all consumers are migrated.
- Announce migration completion to the team.

## 5. Functional Purity, Side Effects, and Functional Composition

- **Always evaluate every action for side effects.**
  - Pure data transformation logic should be separated from side-effectful operations (e.g., DB writes, event emits, logging).
  - Side effects should be moved to the "edges" of the action, after all pure transformations.
- **Prefer functional composition for data transformation pipelines.**
  - Use Ramda and Ramda-Adjunct for composing transformations (`R.pipe`, `R.compose`, `map`, `filter`, etc.).
  - Use Ramda-Adjunct for additional helpers (e.g., `isNotNil`, `isArray`).
  - Functional pipelines should be used wherever they add clarity, testability, or DRYness.
- **Document and isolate impure logic.**
  - If a function must remain impure, document the reason and keep pure parts as isolated as possible.

> This rule applies to all new and refactored actions. Reviewers and AI assistants must always check for side effects and opportunities for functional composition. 