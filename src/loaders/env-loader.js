import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for environment configs
const ENV_PATTERNS = {
  default: '**/environment-*.js',
  development: '**/environment-development.js',
  production: '**/environment-production.js',
  test: '**/environment-test.js'
};

// Environment validation schema
const envSchema = {
  name: String,
  config: Object,
  options: Object
};

// Environment validation
const validateEnv = (module) => {
  const { name, config } = module;
  return name && 
         config && 
         typeof config === 'object' &&
         Object.keys(config).length > 0;
};

// Environment transformation with defaults and validation
const transformEnv = (module) => {
  const { name, config, options = {} } = module;
  
  // Apply environment-specific overrides
  const env = process.env.NODE_ENV || 'development';
  const envConfig = config[env] || {};
  
  // Merge with defaults
  const finalConfig = {
    ...config.defaults,
    ...envConfig,
    NODE_ENV: env
  };

  return {
    name,
    config: finalConfig,
    options,
    type: 'env',
    timestamp: Date.now(),
    // Add environment-specific metadata
    env,
    // Add validation phase
    validate: (context) => {
      const required = options.required || [];
      const missing = required.filter(key => !finalConfig[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      return true;
    }
  };
};

// Create environment loader
export const createEnvLoader = (options = {}) => {
  const loader = createLoader('env', {
    ...options,
    patterns: ENV_PATTERNS,
    validate: validateEnv,
    transform: transformEnv
  });

  return loader;
}; 