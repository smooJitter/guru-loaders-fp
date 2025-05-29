# Loaders Dictionary

A comprehensive reference for all loader types in `src/loaders/`.

---

## env

**Description:** Loads environment-specific configuration and variables, ensuring the application runs with the correct settings for each environment.

- **File Pattern:** `**/env.config.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'main',
    config: {
      defaults: { ... },
      development: { ... },
      production: { ... }
    },
    options: { required: ['DB_URI'] }
  };
  ```
- **Validation:** Ensures `name` is present and `config` is a non-empty object.
- **Transformation:** Merges default and environment-specific configurations, injecting `NODE_ENV` for runtime context.
- **Usage Example:**
  ```js
  import { createEnvLoader } from './env-loader';
  const envLoader = createEnvLoader();
  await envLoader(context);
  ```

---

## db

**Description:** Manages database connections, lifecycle, and seeds development/test data, providing a consistent interface for database operations.

- **File Pattern:** `**/db.config.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'main',
    config: {
      defaults: { uri: 'mongodb://localhost', options: {} },
      development: { ... },
      production: { ... }
    },
    options: { fakers: [/* ... */] }
  };
  ```
- **Validation:** Checks for `name`, `config`, and `config.uri` to ensure database connectivity.
- **Transformation:** Merges configurations and provides `connect`, `disconnect`, and `faker` methods for database operations.
- **Usage Example:**
  ```js
  import { createDbLoader } from './db-loader';
  const dbLoader = createDbLoader();
  await dbLoader(context);
  ```

---

## models

**Description:** Loads and registers data models, defining schemas and options for data representation and manipulation.

- **File Pattern:** `**/models/**/*.model.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'User',
    schema: { ... },
    model: (mongoose) => mongoose.model('User', ...),
    options: { ... }
  };
  ```
- **Validation:** Ensures `name`, `schema`, and `model` function are defined for model integrity.
- **Transformation:** Adds `type: 'model'` and `timestamp` for tracking.
- **Usage Example:**
  ```js
  import { createModelLoader } from './model-loader';
  const modelLoader = createModelLoader();
  await modelLoader(context);
  ```

---

## actions

**Description:** Loads business logic actions, encapsulating methods and metadata for application operations.

- **File Pattern:** `**/actions/**/*.action.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'createUser',
    methods: { main: async (args, ctx) => { ... } },
    meta: { ... },
    options: { ... }
  };
  ```
- **Validation:** Checks for `name` and `methods` object to ensure action completeness.
- **Transformation:** Adds `type: 'actions'` and `timestamp` for action tracking.
- **Usage Example:**
  ```js
  import { createActionLoader } from './action-loader';
  const actionLoader = createActionLoader();
  await actionLoader(context);
  ```

---

## resolvers

**Description:** Loads GraphQL resolvers, defining query and mutation methods for data access and manipulation.

- **File Pattern:** `**/resolvers/**/*.resolver.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserResolver',
    methods: { Query: { ... }, Mutation: { ... } },
    meta: { ... },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are present for resolver functionality.
- **Transformation:** Adds `type: 'resolvers'` and `timestamp` for resolver tracking.
- **Usage Example:**
  ```js
  import { createResolverLoader } from './resolver-loader';
  const resolverLoader = createResolverLoader();
  await resolverLoader(context);
  ```

---

## types

**Description:** Loads and merges GraphQL or other type definitions, ensuring consistent data structures across the application.

- **File Pattern:** `**/types/**/*.type.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserType',
    schema: { ... },
    options: { ... }
  };
  ```
- **Validation:** Checks for `name` and `schema` object to ensure type integrity.
- **Transformation:** Adds `type: 'type'` and `timestamp` for type tracking.
- **Usage Example:**
  ```js
  import { createTypeLoader } from './type-loader';
  const typeLoader = createTypeLoader();
  await typeLoader(context);
  ```

---

## routes

**Description:** Loads HTTP/Express routes, defining route handlers and options for web server operations.

- **File Pattern:** `**/routes/**/*.route.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserRoute',
    methods: { main: async (req, res) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for route functionality.
- **Transformation:** Adds `type: 'route'` and `timestamp` for route tracking.
- **Usage Example:**
  ```js
  import { createRouteLoader } from './route-loader';
  const routeLoader = createRouteLoader();
  await routeLoader(context);
  ```

---

## json

**Description:** Loads JSON schemas or config objects, providing structured data for application configuration.

- **File Pattern:** `**/json/**/*.json.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserJson',
    schema: { ... },
    options: { ... }
  };
  ```
- **Validation:** Checks for `name` and `schema` object to ensure JSON integrity.
- **Transformation:** Adds `type: 'json'` and `timestamp` for JSON tracking.
- **Usage Example:**
  ```js
  import { createJsonLoader } from './json-loader';
  const jsonLoader = createJsonLoader();
  await jsonLoader(context);
  ```

---

## middleware

**Description:** Loads Express middleware functions, providing reusable logic for request processing.

- **File Pattern:** `**/middleware/**/*.middleware.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserMiddleware',
    methods: { main: async (req, res, next) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for middleware functionality.
- **Transformation:** Adds `type: 'middleware'` and `timestamp` for middleware tracking.
- **Usage Example:**
  ```js
  import { createMiddlewareLoader } from './middleware-loader';
  const middlewareLoader = createMiddlewareLoader();
  await middlewareLoader(context);
  ```

---

## sdl

**Description:** Loads GraphQL SDL files and schema builder functions, facilitating schema definition and management.

- **File Pattern:** `**/schema/**/*.graphql`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserSDL',
    schema: { ... },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `schema` object are present for SDL integrity.
- **Transformation:** Adds `type: 'sdl'` and `timestamp` for SDL tracking.
- **Usage Example:**
  ```js
  import { createSDL } from './sdl-loader';
  const sdlLoader = createSDL();
  await sdlLoader(context);
  ```

---

## faker

**Description:** Loads and seeds development/test data for models, providing mock data for testing and development.

- **File Pattern:** `**/fakers/**/*.faker.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserFaker',
    methods: { main: async (args, ctx) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for faker functionality.
- **Transformation:** Adds `type: 'faker'` and `timestamp` for faker tracking.
- **Usage Example:**
  ```js
  import { createFakerLoader } from './faker-loader';
  const fakerLoader = createFakerLoader();
  await fakerLoader(context);
  ```

---

## data

**Description:** Loads DataLoader batch functions for efficient data fetching, optimizing database queries and reducing load.

- **File Pattern:** `**/data/**/*.loader.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserData',
    methods: { main: async (args, ctx) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for data loader functionality.
- **Transformation:** Adds `type: 'data'` and `timestamp` for data loader tracking.
- **Usage Example:**
  ```js
  import { createDataLoader } from './data-loader';
  const dataLoader = createDataLoader();
  await dataLoader(context);
  ```

---

## pubsub

**Description:** Loads PubSub topics and event handlers, facilitating event-driven communication within the application.

- **File Pattern:** `**/pubsub/**/*.pubsub.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserPubSub',
    methods: { main: async (args, ctx) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for PubSub functionality.
- **Transformation:** Adds `type: 'pubsub'` and `timestamp` for PubSub tracking.
- **Usage Example:**
  ```js
  import { createPubSubLoader } from './pubsub-loader';
  const pubSubLoader = createPubSubLoader();
  await pubSubLoader(context);
  ```

---

## plugin

**Description:** Loads plugin hooks for lifecycle, request, and custom events, extending application functionality through plugins.

- **File Pattern:** `**/plugins/**/*.plugin.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserPlugin',
    methods: { main: async (args, ctx) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for plugin functionality.
- **Transformation:** Adds `type: 'plugin'` and `timestamp` for plugin tracking.
- **Usage Example:**
  ```js
  import { createPluginLoader } from './plugin-loader';
  const pluginLoader = createPluginLoader();
  await pluginLoader(context);
  ```

---

## event

**Description:** Loads event handlers for custom event-driven logic, enabling custom responses to application events.

- **File Pattern:** `**/events/**/*.event.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserEvent',
    methods: { main: async (args, ctx) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for event functionality.
- **Transformation:** Adds `type: 'event'` and `timestamp` for event tracking.
- **Usage Example:**
  ```js
  import { createEventLoader } from './event-loader';
  const eventLoader = createEventLoader();
  await eventLoader(context);
  ```

---

## auth

**Description:** Loads authentication roles, guards, and methods, providing security and access control for the application.

- **File Pattern:** `**/auth/**/*.auth.js`
- **Module Shape:**
  ```js
  module.exports = {
    name: 'UserAuth',
    methods: { main: async (args, ctx) => { ... } },
    options: { ... }
  };
  ```
- **Validation:** Ensures `name` and `methods` object are defined for authentication functionality.
- **Transformation:** Adds `type: 'auth'` and `timestamp` for authentication tracking.
- **Usage Example:**
  ```js
  import { createAuthLoader } from './auth-loader';
  const authLoader = createAuthLoader();
  await authLoader(context);
  ```

---

For more details, see the loader's source file or the main `README.md` in this directory. 