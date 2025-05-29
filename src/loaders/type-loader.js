import { gql } from 'graphql-tag';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

// Core context types
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

// Loader-specific types
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

// Query types for introspection
const queryTypes = gql`
  type Query {
    loaderContext: LoaderContext!
    environment: EnvironmentConfig!
    database: DatabaseConfig!
    models: [Model!]!
    types: [TypeConfig!]!
    actions: [Action!]!
    methods: [Method!]!
    graphqlSchema: JSONSchema!
    middleware: [Middleware!]!
    routes: [Route!]!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    loaderContext: (_, __, context) => context,
    environment: (_, __, context) => context.env,
    database: (_, __, context) => context.db,
    models: (_, __, context) => context.models,
    types: (_, __, context) => context.types,
    actions: (_, __, context) => context.actions,
    methods: (_, __, context) => context.methods,
    graphqlSchema: (_, __, context) => context.json,
    middleware: (_, __, context) => context.middleware,
    routes: (_, __, context) => context.routes,
  }
};

// Merge all type definitions
const typeDefs = mergeTypeDefs([
  contextTypes,
  loaderTypes,
  queryTypes
]);

export const createTypeLoader = (options = {}) => {
  return async (context) => {
    try {
      // Add type definitions and resolvers to context
      context.typeDefs = typeDefs;
      context.resolvers = resolvers;

      // Return the enhanced context
      return context;
    } catch (error) {
      context.logger.error('Error in type loader:', error);
      throw error;
    }
  };
}; 