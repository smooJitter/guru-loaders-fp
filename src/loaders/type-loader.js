import { gql } from 'graphql-tag';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

// Core context types (for documentation)
const contextTypes = gql`
  type LoaderContext {
    env: EnvironmentConfig
    db: DatabaseConfig
    models: [Model!]
    types: [TypeConfig!]
    actions: [Action!]
    methods: [Method!]
    json: JSONSchema
    sdl: SDLConfig
    resolvers: [Resolver!]
    middleware: [Middleware!]
    routes: [Route!]
    user: User
  }

  type EnvironmentConfig {
    NODE_ENV: String!
    PORT: Int
    DATABASE_URL: String
    LOG_LEVEL: String
    API_VERSION: String
  }

  type DatabaseConfig {
    connection: String!
    models: [String!]!
    options: JSON
    migrations: [String!]
  }

  type User {
    id: ID!
    email: String
    roles: [String!]
    permissions: [String!]
    tenant: String
  }
`;

// Loader-specific types (for documentation)
const loaderTypes = gql`
  type Model {
    name: String!
    schema: JSON!
    methods: [String!]
    validations: [Validation!]
  }

  type Validation {
    field: String!
    type: String!
    message: String
  }

  type TypeConfig {
    name: String!
    fields: [Field!]!
    interfaces: [String!]
    description: String
  }

  type Field {
    name: String!
    type: String!
    nullable: Boolean
    description: String
    directives: [Directive!]
  }

  type Directive {
    name: String!
    args: JSON
  }

  type Action {
    name: String!
    handler: String!
    permissions: [String!]
    input: JSON
    output: JSON
  }

  type Method {
    name: String!
    implementation: String!
    scope: String
    cache: CacheConfig
  }

  type CacheConfig {
    ttl: Int
    key: String
    tags: [String!]
  }

  type JSONSchema {
    types: [String!]!
    queries: [String!]!
    mutations: [String!]!
    subscriptions: [String!]
  }

  type SDLConfig {
    typeDefs: String!
    resolvers: [String!]!
    directives: [String!]
  }

  type Resolver {
    type: String!
    field: String!
    implementation: String!
    middleware: [String!]
  }

  type Middleware {
    name: String!
    order: Int!
    enabled: Boolean!
    config: JSON
  }

  type Route {
    path: String!
    method: String!
    handler: String!
    middleware: [String!]
  }
`;

// Dynamically build Query fields for all context keys
const buildDynamicQueryType = (context) => {
  const fields = Object.keys(context).map(key => `${key}: JSON`);
  return gql`
    type Query {
      ${fields.join('\n      ')}
    }
  `;
};

// Dynamic resolvers for all context keys
const buildDynamicResolvers = (context) => {
  const resolvers = { Query: {} };
  for (const key of Object.keys(context)) {
    resolvers.Query[key] = (_, __, ctx) => {
      try {
        return ctx[key];
      } catch (err) {
        console.warn(`type-loader: Could not resolve context key '${key}':`, err);
        return null;
      }
    };
  }
  return resolvers;
};

/**
 * Adds dynamic GraphQL introspection for all context keys.
 * Accepts extra typeDefs/resolvers via options for extensibility.
 * @param {object} options - { extraTypeDefs, extraResolvers }
 * @returns {function} Loader function
 */
export const createTypeLoader = (options = {}) => {
  return async (context) => {
    try {
      // Build dynamic Query type and resolvers
      const dynamicQueryType = buildDynamicQueryType(context);
      const dynamicResolvers = buildDynamicResolvers(context);

      // Merge all type definitions
      context.typeDefs = mergeTypeDefs([
        contextTypes,
        loaderTypes,
        dynamicQueryType,
        ...(options.extraTypeDefs || [])
      ]);
      // Merge all resolvers
      context.resolvers = mergeResolvers([
        dynamicResolvers,
        ...(options.extraResolvers || [])
      ]);

      // Return the enhanced context
      return context;
    } catch (error) {
      console.error('Error in type loader:', error);
      throw error;
    }
  };
};

export const typeLoader = createTypeLoader();
export default typeLoader;

// For further extension, see README in this directory. 