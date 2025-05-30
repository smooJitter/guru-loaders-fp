/**
 * Authentication and Authorization Guards
 * These are Higher-Order Functions (HOFs) that wrap resolvers to provide security checks
 */

// Custom error for authentication failures
class AuthenticationError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'UNAUTHENTICATED';
  }
}

// Custom error for authorization failures
class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'UNAUTHORIZED';
  }
}

/**
 * Checks if the user is authenticated
 * @throws {AuthenticationError} If user is not authenticated
 */
export const isAuthenticated = async (resolveParams) => {
  const context = resolveParams.context;
  
  if (!context.user) {
    throw new AuthenticationError('You must be logged in');
  }
  
  return true;
};

/**
 * Checks if the user has the specified role
 * @param {string} role - The role to check for
 * @throws {AuthorizationError} If user doesn't have the required role
 */
export const hasRole = (role) => async (resolveParams) => {
  const context = resolveParams.context;
  
  if (!context.user?.roles?.includes(role)) {
    throw new AuthorizationError(`Must have role: ${role}`);
  }
  
  return true;
};

/**
 * Checks if the user has any of the specified roles
 * @param {string[]} roles - Array of roles to check
 * @throws {AuthorizationError} If user doesn't have any of the required roles
 */
export const hasAnyRole = (roles) => async (resolveParams) => {
  const context = resolveParams.context;
  
  if (!roles.some(role => context.user?.roles?.includes(role))) {
    throw new AuthorizationError(`Must have one of roles: ${roles.join(', ')}`);
  }
  
  return true;
};

/**
 * Checks if the user belongs to the same tenant as the resource
 * @throws {AuthorizationError} If user doesn't belong to the resource's tenant
 */
export const belongsToTenant = () => async (resolveParams) => {
  const context = resolveParams.context;
  const args = resolveParams.args;
  
  // Get tenant from context
  const userTenantId = context.user?.tenantId;
  
  // Get resource tenant (implementation depends on your data structure)
  const resourceTenantId = await context.services.tenant.getResourceTenant(args);
  
  if (userTenantId !== resourceTenantId) {
    throw new AuthorizationError('Resource belongs to a different tenant');
  }
  
  return true;
};

/**
 * Checks if the user owns the resource or has admin rights
 * @throws {AuthorizationError} If user doesn't own the resource and isn't an admin
 */
export const isOwnerOrAdmin = () => async (resolveParams) => {
  const context = resolveParams.context;
  const args = resolveParams.args;
  
  const isAdmin = context.user?.roles?.includes('admin');
  if (isAdmin) return true;
  
  const resourceOwnerId = await context.services.resource.getResourceOwner(args);
  if (context.user?.id !== resourceOwnerId) {
    throw new AuthorizationError('Must be resource owner or admin');
  }
  
  return true;
};

/**
 * Combines multiple guards into a single guard
 * @param {...Function} guards - Guards to combine
 */
export const combineGuards = (...guards) => async (resolveParams) => {
  for (const guard of guards) {
    await guard(resolveParams);
  }
  return true;
};

// Example usage of combining guards:
// export const isAuthenticatedAdmin = combineGuards(isAuthenticated, hasRole('admin')); 