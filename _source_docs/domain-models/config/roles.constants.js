/**
 * Roles constants
 * Defines user role types and role metadata
 */

// Basic role types
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  DEVELOPER: 'developer',
  CUSTOMER: 'customer',
  STAFF: 'staff',
  MANAGER: 'manager',
};

// Array of valid role values
export const ROLE_VALUES = Object.values(ROLES);

// Helper function to check if a role is valid
export const hasRole = (role) => ROLE_VALUES.includes(role);

// Role metadata with additional information
export const ROLE_META = {
  [ROLES.USER]: {
    label: 'User',
    permissions: ['read:own', 'write:own'],
    color: '#607d8b',
    icon: '👤',
  },
  [ROLES.ADMIN]: {
    label: 'Administrator',
    permissions: ['*'],
    color: '#e53935',
    icon: '🛡️',
  },
  [ROLES.MODERATOR]: {
    label: 'Moderator',
    permissions: ['read:any', 'write:own', 'moderate:any'],
    color: '#1e88e5',
    icon: '🔍',
  },
  [ROLES.DEVELOPER]: {
    label: 'Developer',
    permissions: ['read:any', 'write:any', 'debug:any'],
    color: '#4caf50',
    icon: '🧪',
  },
  [ROLES.CUSTOMER]: {
    label: 'Customer',
    permissions: ['read:own'],
    color: '#ff9800',
    icon: '🛒',
  },
  [ROLES.STAFF]: {
    label: 'Staff',
    permissions: ['read:any', 'write:own'],
    color: '#8bc34a',
    icon: '👩‍💻',
  },
  [ROLES.MANAGER]: {
    label: 'Manager',
    permissions: ['read:any', 'write:any', 'manage:staff'],
    color: '#3f51b5',
    icon: '👨‍💼',
  },
}; 