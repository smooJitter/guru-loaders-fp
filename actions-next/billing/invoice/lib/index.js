// Example guard HOF for invoice actions
export const isInvoiceAdmin = (resolver) => async (parent, args, context, info) => {
  if (!context.user || !context.user.roles.includes('admin')) {
    throw new Error('Unauthorized: Admin role required');
  }
  return resolver(parent, args, context, info);
}; 