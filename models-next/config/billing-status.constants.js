/**
 * Billing Status constants (subset)
 * Only includes content, subscription, and invoice status enums/metadata relevant to billing.
 */

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

// Subscription status values
export const SUBSCRIPTION_STATUS_ENUM = ['active', 'past_due', 'canceled'];

// Invoice status values
export const INVOICE_STATUS_ENUM = ['paid', 'open', 'void']; 