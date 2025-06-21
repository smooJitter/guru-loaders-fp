// Common validation functions
export const validateName = (name) => {
  if (!name) throw new Error('Name is required');
  return name;
}; 