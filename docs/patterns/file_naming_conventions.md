---

## 🏷️ Loader-Driven File Naming Conventions (2024)

All loader-discovered files must use dash-case, with a clear prefix for purpose and the entity or concern as the suffix. This ensures cognitive ease, loader compatibility, and scalability.

| File Name Pattern                   | Purpose                        | Example                          |
|-------------------------------------|--------------------------------|----------------------------------|
| `schemaQuery-<entity>.graphql`      | GraphQL query SDL              | `schemaQuery-user.graphql`       |
| `schemaMutation-<entity>.graphql`   | GraphQL mutation SDL           | `schemaMutation-user.graphql`    |
| `schemaType-<entity>.graphql`       | GraphQL type SDL               | `schemaType-user.graphql`        |
| `resolverQuery-<entity>.js`         | Query resolvers                | `resolverQuery-user.js`          |
| `resolverMutation-<entity>.js`      | Mutation resolvers             | `resolverMutation-user.js`       |
| `<entity>-model.js`                 | Data model/schema              | `user-model.js`                  |
| `<entity>-actions.js`               | Business logic/actions         | `user-actions.js`                |
| `<entity>-guards.js`                | Guards/HOFs (optional)         | `user-guards.js`                 |
| `<entity>.test.js`                  | Unit tests (optional)          | `user.test.js`                   |
| `index.js`                          | Module entrypoint              | `index.js`                       |
| `middleware-<purpose>.js`           | Module-specific middleware     | `middleware-auth.js`             |
| `middleware/*.js`                   | Global middleware (in folder)  | `middleware/logger.js`           |
| `route-<purpose>.js`                | Module-specific route handler  | `route-user.js`                  |
| `routes/*.js`                       | Global route handlers (folder) | `routes/health.js`               |
| `environment-<purpose>.js`          | Module-specific environment    | `environment-db.js`              |
| `environment/*.js`                  | Global environment (in folder) | `environment/logger.js`          |
| `type-composer-<entity>.js`         | Code-first GraphQL type composer | `type-composer-user.js`        |

> **All code-first GraphQL type composer files must be named `type-composer-<entity>.js` and will be auto-discovered by the type-composer loader.**

