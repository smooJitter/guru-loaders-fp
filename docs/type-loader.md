# type-loader

The `type-loader` dynamically exposes your loader context as a GraphQL API for introspection, debugging, and developer tooling.

---

## Purpose

- Provides a GraphQL `Query` type with a field for **every key in your loader context** (e.g., `env`, `db`, `models`, `actions`, etc.).
- Allows you to inspect the current state of your app's registries and context via GraphQL queries.
- Useful for debugging, admin UIs, and developer tools.
- Extensible: you can add extra typeDefs and resolvers from other loaders or features.

---

## How It Works

- At runtime, the loader inspects the context and generates a `Query` field for every key (e.g., `models: JSON`, `actions: JSON`).
- All fields resolve to the corresponding value in the context.
- Static type definitions (e.g., `LoaderContext`, `Model`, `Action`, etc.) are included for documentation and editor support.
- You can pass `extraTypeDefs` and `extraResolvers` via options to extend the schema.

---

## Usage Example

```js
import { createTypeLoader } from './loaders/type-loader.js';

// In your loader pipeline
await createTypeLoader()(context);

// In your GraphQL server setup
const { typeDefs, resolvers } = context;
```

**Sample GraphQL Query:**
```graphql
query {
  env
  db
  models
  actions
  user
  // ...any other context key
}
```

---

## Extending the Type Loader

You can add custom fields, types, or resolvers by passing options:

```js
await createTypeLoader({
  extraTypeDefs: [myCustomTypeDefs],
  extraResolvers: [myCustomResolvers]
})(context);
```

---

## Best Practices

- Use the type-loader at the end of your loader pipeline, after all registries are populated.
- Use the introspection API for debugging, admin dashboards, or developer tools.
- Add custom fields/types via `extraTypeDefs` and `extraResolvers` for project-specific needs.
- For large registries, consider adding filtering or pagination in your custom resolvers.

---

## Example: Adding a Custom Field

```js
const myCustomTypeDefs = gql`
  extend type Query {
    customInfo: String
  }
`;
const myCustomResolvers = {
  Query: {
    customInfo: () => 'Hello from custom field!'
  }
};

await createTypeLoader({
  extraTypeDefs: [myCustomTypeDefs],
  extraResolvers: [myCustomResolvers]
})(context);
```

---

## See Also
- [graphql-compose documentation](https://graphql-compose.github.io/docs/)
- [@graphql-tools/merge](https://www.graphql-tools.com/docs/schema-merging/)
- [GraphQL Introspection](https://graphql.org/learn/introspection/)

---

**The type-loader is a powerful tool for making your app's internal state visible and debuggable via GraphQL.** 