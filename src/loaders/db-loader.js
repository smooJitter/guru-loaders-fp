import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for database configs and fakers
const DB_PATTERNS = {
  default: '**/environment-db.js',
  development: '**/environment-db-development.js',
  production: '**/environment-db-production.js',
  test: '**/environment-db-test.js',
  faker: {
    default: '**/faker-*.js',
    seed: '**/seed-*.js',
    index: '**/fakers/index.js'
  }
};

// Database validation schema
const dbSchema = {
  name: String,
  config: Object,
  options: Object,
  fakers: Array // Optional array of faker configurations
};

// Database validation
const validateDb = (module) => {
  const { name, config } = module;
  return name && 
         config && 
         typeof config === 'object' &&
         config.uri && // MongoDB connection URI
         config.options; // Connection options
};

// Database transformation with connection handling
const transformDb = (module) => {
  const { name, config, options = {} } = module;
  
  // Get environment-specific config
  const env = process.env.NODE_ENV || 'development';
  const envConfig = config[env] || {};
  
  // Merge with defaults
  const finalConfig = {
    ...config.defaults,
    ...envConfig,
    options: {
      ...config.defaults?.options,
      ...envConfig?.options
    }
  };

  return {
    name,
    config: finalConfig,
    options,
    type: 'db',
    timestamp: Date.now(),
    // Add connection phase
    connect: async (context) => {
      const { mongoose } = context.services;
      
      try {
        // Connect to MongoDB
        await mongoose.connect(finalConfig.uri, finalConfig.options);
        
        // Add connection to context
        context.db = mongoose.connection;
        
        // Add connection event handlers
        mongoose.connection.on('error', (err) => {
          context.logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          context.logger.warn('MongoDB disconnected');
        });

        return mongoose.connection;
      } catch (error) {
        context.logger.error('Failed to connect to MongoDB:', error);
        throw error;
      }
    },
    // Add disconnection phase
    disconnect: async (context) => {
      if (context.db) {
        await context.db.close();
      }
    },
    // Add faker phase
    faker: async (context) => {
      if (env === 'development' || env === 'test') {
        const { fakers = [] } = options;
        
        for (const faker of fakers) {
          try {
            await faker.seed(context);
            context.logger.info(`Seeded data for ${faker.name}`);
          } catch (error) {
            context.logger.error(`Failed to seed data for ${faker.name}:`, error);
          }
        }
      }
    }
  };
};

// Create database loader
export const createDbLoader = (options = {}) => {
  const loader = createLoader('db', {
    ...options,
    patterns: DB_PATTERNS,
    validate: validateDb,
    transform: transformDb
  });

  return loader;
}; 