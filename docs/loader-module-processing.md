# Loader Module Processing: How It Works

This document explains how the loader system processes modules, especially when using the `withNamespace` utility to export actions from files.

---

## 1. File Exports: Using `withNamespace`

Each action file (e.g., `user-query.actions.js`, `user-mutation.actions.js`) should export an **array of action objects** using the `withNamespace` utility:

```js
export default withNamespace('user', {
  getUserById,
  getUserByEmail,
  // ...other actions
});
```

The result is:
```js
[
  { namespace: 'user', name: 'getUserById', method: [Function] },
  { namespace: 'user', name: 'getUserByEmail', method: [Function] },
  // ...
]
```

---

## 2. Loader Import and Module Collection

When the loader imports all action files, it receives an **array of arrays**:

```js
[
  [ { ... }, { ... } ], // from file 1
  [ { ... }, { ... } ], // from file 2
  // ...
]
```

---

## 3. Flattening Step in `processModules`

The loader's `processModules` function flattens these arrays into a single flat array:

```js
[
  { namespace: 'user', name: 'getUserById', method: [Function] },
  { namespace: 'user', name: 'getUserByEmail', method: [Function] },
  { namespace: 'user', name: 'createUser', method: [Function] },
  { namespace: 'user', name: 'updateUser', method: [Function] },
  // ...all actions from all files
]
```

---

## 4. Downstream Usage

This flat array of action objects is then passed to the registry builder, which organizes them (e.g., by namespace and name) for use in your application context.

---

## 5. Summary Table

| Step                | Output                                      |
|---------------------|---------------------------------------------|
| After import        | `[ [actionObj, ...], [actionObj, ...] ]`    |
| After flattening    | `[ actionObj, actionObj, ... ]`             |

---

## 6. Example Code

Suppose you have two files:

**user-query.actions.js**
```js
export default withNamespace('user', {
  getUserById,
  getUserByEmail
});
```

**user-mutation.actions.js**
```js
export default withNamespace('user', {
  createUser,
  updateUser
});
```

**After processing and flattening:**
```js
[
  { namespace: 'user', name: 'getUserById', method: [Function] },
  { namespace: 'user', name: 'getUserByEmail', method: [Function] },
  { namespace: 'user', name: 'createUser', method: [Function] },
  { namespace: 'user', name: 'updateUser', method: [Function] }
]
```

---

**In short:**
- Each file exports an array of action objects.
- The loader collects these arrays into an array of arrays.
- The flattening step merges them into a single flat array for downstream use. 