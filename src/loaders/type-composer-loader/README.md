# type-composer-loader

A modern, modular system for building and extending GraphQL TypeComposers in a code-first, feature-driven architecture.

---

## Overview

This module provides two complementary loaders:

- **populateTypeComposers.js**: Context-based populator. Ensures every model in `context.models` has a corresponding TypeComposer (e.g., `UserTC`) in `context.typeComposers`, using a shared `schemaComposer` and `composeWithMongoose`.
- **index.js**: File-based loader (using `createLoader`). Discovers all `*.tc.js` (or `*.type-composer.js`) files and executes them as context-aware factories to extend or customize TypeComposers.

---

## Pipeline Usage

1. **Run the context-based populator first:**
   ```js
   import { populateTypeComposers } from './type-composer-loader/populateTypeComposers.js';
   await populateTypeComposers(context); // Ensures all ModelTCs exist
   ```

2. **Then run the file-based loader:**
   ```js
   import typeComposerLoader from './type-composer-loader/index.js';
   await typeComposerLoader(context); // Extends/augments TCs from feature files
   ```

---

## How it Works

- **populateTypeComposers.js**
  - Iterates over all models in `context.models`.
  - For each model, creates a TypeComposer (e.g., `UserTC`) if it doesn't already exist, using `context.composeWithMongoose` and `context.schemaComposer`.
  - Ensures singleton-safe, context-driven composition.

- **index.js**
  - Discovers all `*.tc.js` and `*.type-composer.js` files in your codebase.
  - For each file, imports and executes its default export as a factory with the current context.
  - Each factory can check/create/extend the relevant TypeComposer in `context.typeComposers`.
  - Allows features to incrementally add fields, relations, or plugins to TypeComposers.

---

## Example: Feature TypeComposer File

```js
// src/features/user/user.tc.js
export default (context) => {
  const { models, typeComposers, schemaComposer, composeWithMongoose } = context;
  if (!typeComposers.UserTC) {
    typeComposers.UserTC = composeWithMongoose(models.User, { schemaComposer });
  }
  // Add custom fields or relations
  typeComposers.UserTC.addFields({
    customField: { type: 'String', resolve: () => 'custom' }
  });
  // Optionally return the TC
  return typeComposers.UserTC;
};
```

---

## Best Practices

- Always run `populateTypeComposers` before the file-based loader to guarantee all base TypeComposers exist.
- In your feature `*.tc.js` files, always check for the existence of the TypeComposer before creating it.
- Use the shared `schemaComposer` and `composeWithMongoose` from context for all composition.
- Use the `TC` suffix for all TypeComposer registry keys (e.g., `UserTC`).
- Use hooks and logger from context for lifecycle, validation, and error handling.

---

## References
- [graphql-compose documentation](https://graphql-compose.github.io/docs/)
- [graphql-compose-mongoose documentation](https://graphql-compose.github.io/docs/plugins/plugin-mongoose.html)
- [TypeComposer API](https://graphql-compose.github.io/docs/api/TypeComposer.html)
- [SchemaComposer API](https://graphql-compose.github.io/docs/api/SchemaComposer.html)

---

**This module enables robust, modular, and extensible GraphQL schema composition in a code-first, feature-driven Node.js architecture.** 