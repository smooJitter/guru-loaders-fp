/**
 * Shared Notification Type Composers
 * @module gcm-type-composers/lib/shared/interaction/notification.typeComposer
 * @see domain-models/lib/shared_schema/interaction/notification.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create NotificationAction type composer
export const NotificationActionTC = schemaComposer.createObjectTC({
  name: 'NotificationAction',
  description: 'Action that can be taken on a notification',
  fields: {
    type: {
      type: 'enum NotificationActionType { link button dismiss }',
      description: 'Type of action'
    },
    label: {
      type: 'String!',
      description: 'Display label for the action'
    },
    url: {
      type: 'String',
      description: 'URL for link actions'
    },
    metadata: {
      type: 'JSON',
      description: 'Additional action data'
    }
  }
});

// Create DeliveryStatus type composer
export const DeliveryStatusTC = schemaComposer.createObjectTC({
  name: 'NotificationDeliveryStatus',
  description: 'Delivery status for a notification channel',
  fields: {
    sent: {
      type: 'Boolean',
      description: 'Whether delivery was successful'
    },
    sentAt: {
      type: 'Date',
      description: 'When delivery was attempted'
    },
    error: {
      type: 'String',
      description: 'Error message if delivery failed'
    }
  }
});

// Create DeliveryStatuses type composer
export const DeliveryStatusesTC = schemaComposer.createObjectTC({
  name: 'NotificationDeliveryStatuses',
  description: 'Delivery status across all channels',
  fields: {
    email: {
      type: 'NotificationDeliveryStatus',
      description: 'Email delivery status'
    },
    push: {
      type: 'NotificationDeliveryStatus',
      description: 'Push notification status'
    },
    sms: {
      type: 'NotificationDeliveryStatus',
      description: 'SMS delivery status'
    }
  }
});

// Create main Notification type composer
export const NotificationTC = schemaComposer.createObjectTC({
  name: 'Notification',
  description: 'User notification with multi-channel delivery',
  fields: {
    userId: {
      type: 'MongoID!',
      description: 'User to notify'
    },
    type: {
      type: 'enum NotificationType { system alert info success warning error social promotional }',
      description: 'Type of notification'
    },
    category: {
      type: 'String!',
      description: 'Notification category for grouping'
    },
    title: {
      type: 'String!',
      description: 'Notification title'
    },
    message: {
      type: 'String!',
      description: 'Notification message'
    },
    priority: {
      type: 'Int',
      description: 'Priority level (1-5, 1 highest)',
      defaultValue: 3
    },
    status: {
      type: 'enum NotificationStatus { unread read archived deleted }',
      description: 'Current status',
      defaultValue: 'unread'
    },
    icon: {
      type: 'String',
      description: 'Icon identifier or URL'
    },
    image: {
      type: 'String',
      description: 'Image URL'
    },
    actions: {
      type: '[NotificationAction!]',
      description: 'Available actions'
    },
    entityType: {
      type: 'String!',
      description: 'Type of related entity'
    },
    entityId: {
      type: 'MongoID!',
      description: 'ID of related entity'
    },
    metadata: {
      type: 'JSON',
      description: 'Additional metadata'
    },
    expiresAt: {
      type: 'Date',
      description: 'When notification expires'
    },
    readAt: {
      type: 'Date',
      description: 'When notification was read'
    },
    archivedAt: {
      type: 'Date',
      description: 'When notification was archived'
    },
    deletedAt: {
      type: 'Date',
      description: 'When notification was deleted'
    },
    deliveryStatus: {
      type: 'NotificationDeliveryStatuses',
      description: 'Multi-channel delivery status'
    },
    isExpired: {
      type: 'Boolean!',
      description: 'Whether notification has expired',
      resolve: source => source.expiresAt && new Date() > source.expiresAt
    },
    age: {
      type: 'Int!',
      description: 'Age in milliseconds',
      resolve: source => Date.now() - source.createdAt.getTime()
    }
  }
});

// Add input validation
NotificationTC.getInputTypeComposer().addValidator(value => {
  if (value.priority && (value.priority < 1 || value.priority > 5)) {
    throw new Error('Priority must be between 1 and 5');
  }
  
  if (value.title && value.title.length < 1) {
    throw new Error('Title cannot be empty');
  }
  
  if (value.message && value.message.length < 1) {
    throw new Error('Message cannot be empty');
  }
  
  if (value.actions) {
    value.actions.forEach(action => {
      if (!['link', 'button', 'dismiss'].includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
      }
      if (action.type === 'link' && !action.url) {
        throw new Error('URL required for link actions');
      }
    });
  }
}); 