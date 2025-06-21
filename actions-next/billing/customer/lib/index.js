// Example guard HOF for customer actions
export const isCustomerAdmin = (resolver) => async (parent, args, context, info) => {
  if (!context.user || !context.user.roles.includes('admin')) {
    throw new Error('Unauthorized: Admin role required');
  }
  return resolver(parent, args, context, info);
}; 