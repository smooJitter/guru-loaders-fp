
1. **Base Loader Pattern** (Common to All):
    ```javascript
        export default {
            name: 'ModuleName',
            methods: { ... }
        };
    ```


2. **Mongoose Model**:
    ```javascript
        // user.model.js
        export default {
        name: 'User',
        schema: new mongoose.Schema({ ... })
        };
        export default {
        name: 'User',
        schema: new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true }
        }),
        model: mongoose.model('User', schema)  // DB model instance
        };
    ```

3. **Pothos Type-Composer**:

    ```javascript
    export default {
    name: 'User',
    schema: builder.objectType('User', { ... })
    };
    export default {
    name: 'User',
    schema: builder.objectType('User', {
        fields: (t) => ({
        name: t.string({ required: true }),
        email: t.string({ required: true })
        })
    }),
    compose: builder.objectType('User').build()  // GraphQL type instance
    };
    ```

4. **GraphQL-Compose SchemaComposer**:

    ```javascript
    // user.schema-compose.js
    export default {
    name: 'User',
    schema: schemaComposer.createObjectTC({ ... })
    };
    export default {
    name: 'User',
    schema: schemaComposer.createObjectTC({
        name: 'User',
        fields: {
        name: 'String!',
        email: 'String!'
        }
    }),
    compose: schemaComposer.createObjectTC('User').getType()  // GraphQL type instance
    };








5. **Action/Method Loaders**:
    ```javascript
    // Actions
    export default {
        name: 'UserActions',
        methods: {
            createUser: async (input, context) => { ... }
        },
        meta: {
            createUser: { middleware: [...] }
        }
    };

    // Methods
    export default {
        name: 'UserMethods',
        methods: {
            validate: (data) => { ... }
        }
    };
    ```

6. **Resolver-Composer Loader**:
    ```javascript
    export default {
    name: 'UserResolvers',
    methods: {
        // Root resolvers
        Query: { ... },
        Mutation: { ... },
        // Field resolvers
        User: { ... },
        Post: { ... }
    },
    meta: {
        'User.posts': { middleware: [...] }
    }
    };
    ```




















**Common Patterns Across All Loaders**:
1. All have a `name` property
2. All can be factory functions for context injection
3. All support hot reloading
4. All follow similar file discovery patterns
5. All can have meta information
6. All can have middleware

**Key Differences**:
1. **Models**: Focus on schema definition
   - Mongoose: Database schema
   - Pothos: Code-first GraphQL
   - GraphQL-Compose: Schema-first GraphQL

2. **Actions/Methods**: Focus on business logic
   - Actions: Operations with middleware
   - Methods: Validation/utility functions

3. **Resolver-Composer**: Focus on GraphQL resolution
   - Root resolvers (Query/Mutation)
   - Field resolvers
   - Type-specific organization

**Loader Implementation Pattern**:
```javascript
export default async function loader({ logger, config } = {}) {
  // 1. Find files
  const files = await findFiles(pattern);
  
  // 2. Process each file
  const registry = {};
  for (const file of files) {
    const mod = await import(file);
    const { name, ...rest } = mod.default;
    
    // 3. Register based on type
    registry[name] = {
      ...rest,
      // Additional processing based on loader type
    };
  }
  
  // 4. Return registry
  return registry;
}
```

This unified pattern makes it easy to:
1. Add new loader types
2. Share common functionality
3. Maintain consistency
4. Support hot reloading
5. Handle context injection
6. Apply middleware

Would you like me to elaborate on any of these patterns or show how they could be further unified?





Now we have:
- `model`: For Mongoose DB models
- `compose`: For GraphQL type composers

This makes it clear in context:
```javascript
// In resolvers/actions
const { User } = context.models;      // DB model
const { User } = context.composers;   // GraphQL type

// In loaders
const { name, schema, model } = mod.default;    // For models
const { name, schema, compose } = mod.default;  // For composers
```

Would you like me to show how this affects the loader implementation?




