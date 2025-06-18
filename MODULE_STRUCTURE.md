# Module Structure Guide

## 🔑 Core Requirements

### 1. Default Export
```javascript
export default (context) => ({
    name: 'moduleName',    // Required: String identifier
    service: {             // Required: Main implementation
        find: () => context.db.collection.find(),
        create: (data) => context.db.collection.create(data),
        update: (id, data) => context.db.collection.update(id, data),
        delete: (id) => context.db.collection.delete(id)
    }
});
```

### 2. Context Injection
- Database access: `context.db`
- Services: `context.services`
- Configuration: `context.config`

---

## 🚀 Common Features (Priority Order)

### 1. Service Methods
```javascript
service: {
    // Core CRUD
    find: () => {},
    findById: () => {},
    create: () => {},
    update: () => {},
    delete: () => {},

    // Business Logic
    validate: () => {},
    transform: () => {}
}
```

### 2. GraphQL Integration
```javascript
{
    // Queries
    queries: {
        getItem: (_, { id }) => context.db.items.findById(id),
        listItems: () => context.db.items.find()
    },

    // Mutations
    mutations: {
        createItem: (_, { input }) => context.db.items.create(input),
        updateItem: (_, { id, input }) => context.db.items.update(id, input)
    },

    // Resolvers
    resolvers: {
        Item: {
            computedField: (item) => `${item.field1} ${item.field2}`
        }
    }
}
```

### 3. Data Models
```javascript
{
    models: {
        Item: {
            schema: {
                name: String,
                description: String,
                createdAt: Date
            }
        }
    }
}
```

---

## 📦 Optional Features

### 1. Configuration
```javascript
{
    config: {
        version: '1.0.0',
        dependencies: ['db', 'auth'],
        options: {
            // Module-specific options
        }
    }
}
```

### 2. Lifecycle Hooks
```javascript
{
    hooks: {
        beforeCreate: async (data) => {
            // Pre-create validation/transformation
        },
        afterCreate: async (item) => {
            // Post-create operations
        }
    }
}
```

### 3. Event Handlers
```javascript
{
    events: {
        'item.created': (item) => {
            // Handle creation event
        },
        'item.updated': (item) => {
            // Handle update event
        }
    }
}
```

---

## 🔄 Legacy Support

### 1. Methods Format
```javascript
{
    methods: {
        formatData: (data) => {},
        validateInput: (input) => {}
    }
}
```

### 2. Named Exports
```javascript
// Constants
export const constants = {
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive'
    }
};

// Utilities
export const utils = {
    formatName: (name) => name.toUpperCase(),
    validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};
```

---

## 🎯 Best Practices

1. **Always include required fields**
   - `name`: String identifier
   - `service`: Implementation object

2. **Context usage**
   - Use context for dependencies
   - Avoid direct imports of services
   - Keep modules pure and testable

3. **Type safety**
   - Document expected types
   - Validate inputs
   - Handle edge cases

4. **Code organization**
   - Group related functionality
   - Use clear naming conventions
   - Keep files focused and manageable

5. **Documentation**
   - Document public interfaces
   - Include usage examples
   - Note any dependencies

---

## 📝 Module Checklist

- [ ] Has required `name` and `service` properties
- [ ] Uses context injection properly
- [ ] Includes necessary type definitions
- [ ] Has appropriate error handling
- [ ] Follows naming conventions
- [ ] Is properly documented
- [ ] Has tests (if applicable)
- [ ] Handles edge cases
- [ ] Is pure (no side effects)
- [ ] Has clear dependencies 