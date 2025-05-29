




Yes! All loaders can be context-aware through injection. Here's how each pattern handles context:

1. **Model Loader**:
```javascript
// user.model.js
export default ({ logger, config }) => ({
  name: 'User',
  schema: new mongoose.Schema({ ... }),
  model: mongoose.model('User', schema)
});
```

2. **Type Composer**:
```javascript
// user.tc.js
export default ({ builder, logger }) => ({
  name: 'User',
  schema: builder.objectType('User', { ... }),
  tc: builder.objectType('User').build()
});
```

3. **Action Loader**:
```javascript
// user.actions.js
export default ({ models, logger, actions }) => ({
  name: 'UserActions',
  methods: {
    createUser: async (input, context) => { ... }
  },
  meta: {
    createUser: { middleware: [...] }
  }
});
```

4. **Method Loader**:
```javascript
// user.methods.js
export default ({ logger, config }) => ({
  name: 'UserMethods',
  methods: {
    validate: (data) => { ... }
  }
});
```

5. **Resolver Composer**:
```javascript
// user.resolvers.js
export default ({ models, types, logger }) => ({
  name: 'UserResolvers',
  methods: {
    Query: { ... },
    Mutation: { ... },
    User: { ... }
  },
  meta: {
    'User.posts': { middleware: [...] }
  }
});
```

6. **SDL Loader**:
```javascript
// user.sdl.js
export default ({ logger, config }) => ({
  name: 'User',
  schema: `
    type User { ... }
  `,
  ast: parse(schema),
  meta: { ... }
});
```

The loader implementation handles this:
```javascript
// In the loader
const mod = await import(file);
const { name, ...rest } = typeof mod.default === 'function' 
  ? mod.default(context)  // Inject context if it's a factory
  : mod.default;         // Use as-is if not a factory

registry[name] = rest;
```

This means:
1. All loaders can be factory functions
2. All can receive context (logger, config, etc.)
3. All can access other loaded modules
4. All can be hot-reloaded with new context

Would you like me to show how this affects the unified loader implementation?









Ah yes! That's even better - let's make it more explicit with "composeTypes" and "composeResolvers". Here's the updated list:

1. **Model Loader**:
```javascript
// user.model.js
export default {
  name: 'User',
  schema: new mongoose.Schema({ ... }),
  model: mongoose.model('User', schema)
};
```

2. **Compose Types**:
```javascript
// user.compose-types.js
export default {
  name: 'User',
  schema: builder.objectType('User', { ... }),
  compose: builder.objectType('User').build()
};
```

3. **Action Loader**:
```javascript
// user.actions.js
export default {
  name: 'UserActions',
  methods: {
    createUser: async (input, context) => { ... }
  },
  meta: {
    createUser: { middleware: [...] }
  }
};
```

4. **Method Loader**:
```javascript
// user.methods.js
export default {
  name: 'UserMethods',
  methods: {
    validate: (data) => { ... }
  }
};
```

5. **Compose Resolvers**:
```javascript
// user.compose-resolvers.js
export default {
  name: 'UserResolvers',
  methods: {
    Query: { ... },
    Mutation: { ... },
    User: { ... }  // Field resolvers
  },
  meta: {
    'User.posts': { middleware: [...] }
  }
};
```

6. **SDL Loader**:
```javascript
// user.sdl.js
export default {
  name: 'User',
  schema: `
    type User { ... }
  `,
  ast: parse(schema),
  meta: { ... }
};
```

Now the naming is even clearer:
- `model`: Database models
- `compose-types`: GraphQL type definitions
- `actions`: Business logic
- `methods`: Utilities
- `compose-resolvers`: GraphQL resolvers
- `sdl`: Schema definitions

This makes it very clear that:
1. `compose-types` is for defining GraphQL types
2. `compose-resolvers` is for defining GraphQL resolvers

Would you like me to show how this affects the loader implementation?











Let me summarize all the loader patterns we've discussed:

1. **Model Loaders**:
```javascript
// user.model.js
export default {
  name: 'User',
  schema: new mongoose.Schema({ ... }),
  model: mongoose.model('User', schema)
};
```

2. **Type Composers**:
```javascript
// user.type-compose.js
export default {
  name: 'User',
  schema: builder.objectType('User', { ... }),
  compose: builder.objectType('User').build()
};
```

3. **Action Loaders**:
```javascript
// user.actions.js
export default {
  name: 'UserActions',
  methods: {
    createUser: async (input, context) => { ... }
  },
  meta: {
    createUser: { middleware: [...] }
  }
};
```

4. **Method Loaders**:
```javascript
// user.methods.js
export default {
  name: 'UserMethods',
  methods: {
    validate: (data) => { ... }
  }
};
```

5. **Resolver-Composer Loaders**:
```javascript
// user.resolver-compose.js
export default {
  name: 'UserResolvers',
  methods: {
    Query: { ... },
    Mutation: { ... },
    User: { ... }  // Field resolvers
  },
  meta: {
    'User.posts': { middleware: [...] }
  }
};
```

So we have 5 distinct loader patterns, each with their own purpose:
1. `model`: Database models (Mongoose)
2. `compose`: GraphQL type definitions
3. `actions`: Business logic operations
4. `methods`: Utility/validation functions
5. `resolver-compose`: GraphQL resolvers

Each follows the base pattern of:
- `name`: Identifier
- Specific properties based on purpose
- Optional `meta` for middleware/config

Would you like me to show how these could be unified in a single loader system?




1. **SDL Loader**:
```javascript
// user.sdl.js
export default {
  name: 'User',
  schema: `
    type User {
      id: ID!
      name: String!
      email: String!
    }
  `,
  ast: parse(schema),
  meta: {
    directives: [...]
  }
};
```

2. **JSON Loader**:
```javascript
// user.json.js
export default {
  name: 'User',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' }
    },
    required: ['id', 'name', 'email']
  },
  meta: {
    validations: [...]
  }
};
```

They are very similar! Both:
1. Define schemas in a declarative format
2. Can be parsed/validated
3. Can have metadata
4. Are used for validation

The main differences:
- SDL: GraphQL schema language
- JSON: JSON Schema format

So we could consider them part of the same "declarative schema" pattern:

```javascript
// Declarative Schema Pattern
export default {
  name: 'User',
  schema: string | object,  // SDL string or JSON object
  parsed: AST | object,     // Parsed result
  meta: {
    validations: [...],
    directives: [...]
  }
};
```

Would you like me to show how this affects our loader patterns?











