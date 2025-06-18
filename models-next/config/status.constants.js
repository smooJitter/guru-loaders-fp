/**
 * Status constants for content workflow and tracking
 */

// Basic system status values (uppercase)
export const SYSTEM_STATUS_ENUMS = ['DRAFT', 'PENDING', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

// System status metadata including allowed transitions
export const SYSTEM_STATUS_META = {
  DRAFT: {
    label: 'Draft',
    description: 'Initial state, not yet published',
    color: 'gray',
    transitionsTo: ['PENDING', 'ACTIVE'],
  },
  PENDING: {
    label: 'Pending',
    description: 'Awaiting approval or review',
    color: 'yellow',
    transitionsTo: ['ACTIVE', 'INACTIVE', 'DRAFT'],
  },
  ACTIVE: {
    label: 'Active',
    description: 'Published and active',
    color: 'green',
    transitionsTo: ['INACTIVE', 'ARCHIVED'],
  },
  INACTIVE: {
    label: 'Inactive',
    description: 'Temporarily disabled',
    color: 'red',
    transitionsTo: ['ACTIVE', 'ARCHIVED'],
  },
  ARCHIVED: {
    label: 'Archived',
    description: 'Permanently disabled/archived',
    color: 'gray',
    transitionsTo: ['ACTIVE'], // Only in exceptional cases
  },
};

// Content workflow status values (lowercase)
export const CONTENT_STATUS_ENUMS = ['draft', 'review', 'published', 'archived'];

// Content workflow status metadata
export const CONTENT_STATUS_META = {
  draft: {
    label: 'Draft',
    type: 'content',
    color: '#ccc',
    icon: '📝',
    transitionsTo: ['review'],
  },
  review: {
    label: 'In Review',
    type: 'content',
    color: '#ffa500',
    icon: '🔍',
    transitionsTo: ['published', 'archived'],
  },
  published: {
    label: 'Published',
    type: 'content',
    color: '#4caf50',
    icon: '✅',
    transitionsTo: ['archived'],
  },
  archived: {
    label: 'Archived',
    type: 'content',
    color: '#607d8b',
    icon: '🗃️',
    isFinal: true,
  },
};

// For backward compatibility
export const STATUS_ENUMS = SYSTEM_STATUS_ENUMS;
export const STATUS_META = SYSTEM_STATUS_META;

// User account status values
export const USER_ACCOUNT_STATUS_ENUM = ['active', 'suspended'];

// User account status metadata (defining allowed transitions)
export const USER_ACCOUNT_STATUS_META = {
  active: {
    label: 'Active',
    description: 'User account is active and can log in.',
    color: 'green',
    transitionsTo: ['suspended'],
  },
  suspended: {
    label: 'Suspended',
    description: 'User account is suspended and cannot log in.',
    color: 'red',
    transitionsTo: ['active'],
  },
};

// Subscription status values
export const SUBSCRIPTION_STATUS_ENUM = ['active', 'past_due', 'canceled'];

// Invoice status values
export const INVOICE_STATUS_ENUM = ['paid', 'open', 'void'];
