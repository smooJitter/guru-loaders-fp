# File Organization and Naming Conventions

## 🏷️ Loader-Driven File Naming Conventions (2024)

All loader-discovered files must use dash-case, with the entity as prefix and type as suffix. This ensures cognitive ease, loader compatibility, and scalability.

| File Name Pattern                   | Purpose                        | Example                          |
|-------------------------------------|--------------------------------|----------------------------------|
| `<entity>-query.graphql`            | GraphQL query SDL              | `user-query.graphql`             |
| `<entity>-mutation.graphql`         | GraphQL mutation SDL           | `user-mutation.graphql`          |
| `<entity>-type.graphql`             | GraphQL type SDL               | `user-type.graphql`              |
| `<entity>-query.js`                 | Query resolvers                | `user-query.js`                  |
| `<entity>-mutation.js`              | Mutation resolvers             | `user-mutation.js`               |
| `<entity>-model.js`                 | Data model/schema              | `user-model.js`                  |
| `<entity>-actions.js`               | Business logic/actions         | `user-actions.js`                |
| `index.js` (in actions/)            | Actions namespace entrypoint   | `modules/user/actions/index.js`  |
| `<entity>-guards.js`                | Guards/HOFs (optional)         | `user-guards.js`                 |
| `<entity>.test.js`                  | Unit tests (optional)          | `user.test.js`                   |
| `index.js`                          | Module entrypoint              | `index.js`                       |
| `<entity>-middleware.js`            | Module-specific middleware     | `auth-middleware.js`             |
| `middleware/*.js`                   | Global middleware (in folder)  | `middleware/logger.js`           |
| `<entity>-route.js`                 | Module-specific route handler  | `user-route.js`                  |
| `routes/*.js`                       | Global route handlers (folder) | `routes/health.js`               |
| `<entity>-environment.js`           | Module-specific environment    | `db-environment.js`              |
| `environment/*.js`                  | Global environment (in folder) | `environment/logger.js`          |
| `<entity>-typecomposer.js`          | Code-first GraphQL type composer | `user-typecomposer.js`         |

## 4c1 File Organization Rules

### File Location Rules

1. **Type-based Organization**:
   - Files can be placed in their corresponding type directory under `src/`
   - Example: `src/actions/user-actions.js`

2. **Feature-based Organization**:
   - Files can be placed anywhere under `modules/`
   - EXCEPT directly under a directory that doesn't match their type
   - Example: `modules/user/actions/user-actions.js` is valid (directory matches type)
   - Example: `modules/user/models/user-actions.js` is invalid (directory doesn't match type)
   - **Special Case:** Any `index.js` file under an `actions/` directory (no matter how deep) is always valid and will be discovered by the actions-loader.

### Valid Directory Structure

```
src/
├── actions/           # Type-based organization
│   ├── user-actions.js
│   └── todo-actions.js
│   └── index.js       # ✅ Valid (actions namespace entrypoint)
├── models/           
│   ├── user-model.js
│   └── todo-model.js
└── routes/           
    ├── user-route.js
    └── todo-route.js

modules/
├── user/             # Feature-based organization
│   ├── actions/      # Can contain *.actions.js files
│   │   └── user-actions.js    ✅ Valid
│   │   └── index.js           ✅ Valid (actions namespace entrypoint)
│   ├── models/       # Can contain *.model.js files
│   │   └── user-model.js      ✅ Valid
│   └── routes/       # Can contain *.route.js files
│       └── user-route.js      ✅ Valid
├── todo/             
│   ├── actions/      # Can contain *.actions.js files
│   │   └── todo-actions.js    ✅ Valid
│   │   └── index.js           ✅ Valid (actions namespace entrypoint)
│   ├── models/       # Can contain *.model.js files
│   │   └── todo-model.js      ✅ Valid
│   └── routes/       # Can contain *.route.js files
│       └── todo-route.js      ✅ Valid
└── shared/           
    ├── actions/      # Can contain *.actions.js files
    │   └── auth-actions.js    ✅ Valid
    │   └── index.js           ✅ Valid (actions namespace entrypoint)
    └── models/       # Can contain *.model.js files
        └── logging-model.js   ✅ Valid
```

### Examples

#### Valid File Locations:
```
src/actions/user-actions.js              ✅ Valid (type directory)
src/actions/index.js                     ✅ Valid (actions namespace entrypoint)
modules/user/actions/index.js            ✅ Valid (actions namespace entrypoint)
modules/shared/actions/index.js          ✅ Valid (actions namespace entrypoint)
modules/user/actions/user-actions.js     ✅ Valid (directory matches type)
modules/shared/actions/auth-actions.js   ✅ Valid (directory matches type)
modules/user/features/actions.js         ✅ Valid (not directly under type directory)
```

#### Invalid File Locations:
```
modules/user/models/user-actions.js      ❌ Invalid (directory doesn't match type)
modules/user/routes/user-model.js        ❌ Invalid (directory doesn't match type)
modules/user/actions/user-model.js       ❌ Invalid (directory doesn't match type)
```

### Loader Patterns

| Loader Type | File Pattern | Valid Locations |
|-------------|--------------|-----------------|
| Actions     | `**/*.actions.js`, `**/actions/**/*.index.js` | `src/actions/`, `modules/**/actions/` |
| Models      | `**/*.model.js` | `src/models/`, `modules/**/models/` |
| Routes      | `**/*.route.js` | `src/routes/`, `modules/**/routes/` |
| PubSub      | `**/*.pubsub.js` | `src/pubsub/`, `modules/**/pubsub/` |
| Resolvers   | `**/*.resolver.js` | `src/resolvers/`, `modules/**/resolvers/` |
| Types       | `**/*.type.js` | `src/types/`, `modules/**/types/` |
| Middleware  | `**/*.middleware.js` | `src/middleware/`, `modules/**/middleware/` |
| Events      | `**/*.event.js` | `src/events/`, `modules/**/events/` |
| Auth        | `**/*.auth.js` | `src/auth/`, `modules/**/auth/` |
| Data        | `**/*.data.js` | `src/data/`, `modules/**/data/` |
| Faker       | `**/*.faker.js` | `src/faker/`, `modules/**/faker/` |
| Plugin      | `**/*.plugin.js` | `src/plugin/`, `modules/**/plugin/` |

### Best Practices

1. **Organization Choice**:
   - Use `src/<type>/` for type-based organization
   - Use `modules/<feature>/<type>/` for feature-based organization
   - Files must be in directories matching their type
   - **Special Case:** Any `index.js` under an `actions/` directory is always valid and will be discovered by the actions-loader.

2. **Naming**:
   - Always use `<entity>-<type>.js` format (except for `index.js` in actions/)
   - Keep entity names consistent across related files

3. **Directory Structure**:
   - Keep files in their correct type directories under `src/`
   - Keep feature-based files in type-matching directories under `modules/`
   - Never place files in directories that don't match their type

> **Note**: All code-first GraphQL type composer files must be named `<entity>-typecomposer.js` and will be auto-discovered by the type-composer loader.

