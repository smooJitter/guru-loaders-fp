import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for auth
const AUTH_PATTERNS = {
  default: '**/auth-*.js',
  roles: '**/roles-*.js',
  guards: '**/guards-*.js',
  index: '**/auth/index.js'
};

// Auth validation schema
const authSchema = {
  name: String,
  roles: Object,
  guards: Object,
  options: Object
};

// Auth validation
const validateAuth = (module) => {
  const { name, roles, guards } = module;
  return name && 
         roles && 
         typeof roles === 'object' &&
         guards && 
         typeof guards === 'object';
};

// Auth transformation
const transformAuth = (module) => {
  const { name, roles, guards, options = {} } = module;
  
  return {
    name,
    roles,
    guards,
    options,
    type: 'auth',
    timestamp: Date.now(),
    // Create Auth instance
    create: (context) => {
      const { auth, logger } = context.services;
      
      if (!auth) {
        throw new Error('Auth service not found in context');
      }

      // Register roles
      const registeredRoles = {};
      Object.entries(roles).forEach(([key, value]) => {
        registeredRoles[key] = {
          name: key,
          permissions: value.permissions || [],
          description: value.description || '',
          isDefault: value.isDefault || false
        };
      });

      // Register guards
      const registeredGuards = {};
      Object.entries(guards).forEach(([key, guard]) => {
        if (typeof guard === 'function') {
          registeredGuards[key] = async (...args) => {
            try {
              return await guard(...args, context);
            } catch (error) {
              logger.error(`Error in ${name} guard ${key}:`, error);
              throw error;
            }
          };
        }
      });

      return {
        // Role management
        roles: registeredRoles,
        // Guard access
        guards: registeredGuards,
        // Authentication methods
        authenticate: async (credentials) => {
          try {
            return await auth.authenticate(credentials, context);
          } catch (error) {
            logger.error(`Authentication error in ${name}:`, error);
            throw error;
          }
        },
        // Authorization methods
        authorize: async (user, resource, action) => {
          try {
            return await auth.authorize(user, resource, action, context);
          } catch (error) {
            logger.error(`Authorization error in ${name}:`, error);
            throw error;
          }
        },
        // Role checking
        hasRole: (user, role) => {
          return auth.hasRole(user, role, context);
        },
        hasAnyRole: (user, roles) => {
          return auth.hasAnyRole(user, roles, context);
        },
        // Permission checking
        hasPermission: (user, permission) => {
          return auth.hasPermission(user, permission, context);
        },
        hasAnyPermission: (user, permissions) => {
          return auth.hasAnyPermission(user, permissions, context);
        },
        // Session management
        createSession: async (user) => {
          return await auth.createSession(user, context);
        },
        validateSession: async (session) => {
          return await auth.validateSession(session, context);
        },
        destroySession: async (session) => {
          return await auth.destroySession(session, context);
        }
      };
    }
  };
};

// Create auth loader
export const createAuthLoader = (options = {}) => {
  const loader = createLoader('auth', {
    ...options,
    patterns: AUTH_PATTERNS,
    validate: validateAuth,
    transform: transformAuth
  });

  return loader;
}; 