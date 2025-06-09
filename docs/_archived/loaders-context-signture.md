Here's a streamlined app context object that combines all our loader patterns:

```javascript
// app.context.js
export default {
// Core services
    logger: logger,
    config: config,

// Database & Models
    models: {
    User: UserModel,
    Post: PostModel
    },

// GraphQL Types
    types: {
    UserTC: UserTypeComposer,
    PostTC: PostTypeComposer
    },

// Business Logic
    actions: {
    UserActions: {
        createUser: async (input, context) => { ... },
        updateUser: async (input, context) => { ... }
    },
    PostActions: {
        createPost: async (input, context) => { ... }
    }
    },

// Utilities
    methods: {
    UserMethods: {
        validate: (data) => { ... }
    }
    },

// GraphQL Resolvers
    resolvers: {
    Query: {
        user: async (_, { id }, context) => { ... },
        post: async (_, { id }, context) => { ... }
    },
    Mutation: {
        createUser: async (_, { input }, context) => { ... }
    },
    User: {
        posts: async (user, _, context) => { ... }
    }
    }
};
```

This context is:
1. **Hierarchical**: Organized by purpose
2. **Injected**: Available to all loaders
3. **Self-referential**: Loaders can access other parts
4. **Type-safe**: Each section has a clear structure

Would you like me to show how this context is used in the loaders?







Here's how each loader uses the context:

1. **Model Loader**:
```javascript
// user.model.js
export default ({ logger, config }) => ({
  name: 'User',
  schema: new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }
  }),
  model: mongoose.model('User', schema)
});

// Usage in resolver
const { User } = context.models;
const user = await User.findById(id);
```

2. **Type Composer**:
```javascript
// user.tc.js
export default ({ builder, logger, models }) => ({
  name: 'User',
  schema: builder.objectType('User', {
    fields: (t) => ({
      name: t.string({ required: true }),
      email: t.string({ required: true }),
      // Can reference other types
      posts: t.field({
        type: [builder.objectRef('Post')],
        resolve: (user) => context.models.Post.find({ userId: user.id })
      })
    })
  }),
  tc: builder.objectType('User').build()
});

// Usage in resolver
const { UserTC } = context.types;
```

3. **Action Loader**:
```javascript
// user.actions.js
export default ({ models, logger, actions }) => ({
  name: 'UserActions',
  methods: {
    createUser: async (input, context) => {
      const { User } = context.models;
      const user = await User.create(input);
      return user;
    },
    // Can use other actions
    createUserWithPost: async (input, context) => {
      const user = await context.actions.UserActions.createUser(input);
      await context.actions.PostActions.createPost({ 
        ...input.post,
        userId: user.id 
      });
      return user;
    }
  }
});

// Usage in resolver
const user = await context.actions.UserActions.createUser(input);
```

4. **Method Loader**:
```javascript
// user.methods.js
export default ({ logger, config }) => ({
  name: 'UserMethods',
  methods: {
    validate: (data) => {
      // Can use config for validation rules
      const { rules } = context.config.validation;
      return validate(data, rules);
    }
  }
});

// Usage in action
const isValid = context.methods.UserMethods.validate(input);
```

5. **Resolver Composer**:
```javascript
// user.resolvers.js
export default ({ models, types, actions, logger }) => ({
  name: 'UserResolvers',
  methods: {
    Query: {
      user: async (_, { id }, context) => {
        const { User } = context.models;
        return User.findById(id);
      }
    },
    Mutation: {
      createUser: async (_, { input }, context) => {
        // Can use actions
        return context.actions.UserActions.createUser(input);
      }
    },
    User: {
      posts: async (user, _, context) => {
        const { Post } = context.models;
        return Post.find({ userId: user.id });
      }
    }
  }
});

// Usage in GraphQL
const { resolvers } = context;
```

The key points:
1. Each loader gets the context it needs
2. Loaders can access other parts of context
3. Context is passed through the chain
4. Everything is type-safe and predictable

Would you like me to show how this all comes together in the main loader?
