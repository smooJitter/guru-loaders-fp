/**
 * Shared Comment Type Composers
 * @module gcm-type-composers/lib/shared/interaction/comment.typeComposer
 * @see domain-models/lib/shared_schema/interaction/comment.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create Reaction type composer
export const ReactionTC = schemaComposer.createObjectTC({
  name: 'CommentReaction',
  description: 'User reaction to a comment',
  fields: {
    type: {
      type: 'enum ReactionType { like love haha wow sad angry }',
      description: 'Type of reaction'
    },
    userId: {
      type: 'MongoID!',
      description: 'User who reacted'
    },
    createdAt: {
      type: 'Date!',
      description: 'When the reaction was added'
    }
  }
});

// Create Flag type composer
export const FlagTC = schemaComposer.createObjectTC({
  name: 'CommentFlag',
  description: 'Flag raised on inappropriate content',
  fields: {
    reason: {
      type: 'String!',
      description: 'Reason for flagging'
    },
    userId: {
      type: 'MongoID!',
      description: 'User who flagged'
    },
    createdAt: {
      type: 'Date!',
      description: 'When the flag was raised'
    }
  }
});

// Create EditHistory type composer
export const EditHistoryTC = schemaComposer.createObjectTC({
  name: 'CommentEditHistory',
  description: 'Record of comment edits',
  fields: {
    content: {
      type: 'String!',
      description: 'Previous content'
    },
    editedAt: {
      type: 'Date!',
      description: 'When the edit was made'
    }
  }
});

// Create main Comment type composer
export const CommentTC = schemaComposer.createObjectTC({
  name: 'Comment',
  description: 'User comment with threading support',
  fields: {
    content: {
      type: 'String!',
      description: 'Comment text content'
    },
    userId: {
      type: 'MongoID!',
      description: 'User who created the comment'
    },
    entityType: {
      type: 'String!',
      description: 'Type of entity this comment belongs to'
    },
    entityId: {
      type: 'MongoID!',
      description: 'ID of entity this comment belongs to'
    },
    parentId: {
      type: 'MongoID',
      description: 'Parent comment ID for replies'
    },
    status: {
      type: 'enum CommentStatus { active hidden deleted flagged }',
      description: 'Current comment status',
      defaultValue: 'active'
    },
    reactions: {
      type: '[CommentReaction!]',
      description: 'User reactions to this comment'
    },
    metadata: {
      type: 'JSON',
      description: 'Additional metadata'
    },
    editHistory: {
      type: '[CommentEditHistory!]',
      description: 'History of content edits'
    },
    flags: {
      type: '[CommentFlag!]',
      description: 'Content flags raised'
    },
    replyCount: {
      type: 'Int!',
      description: 'Number of replies',
      resolve: source => source.model('Comment').countDocuments({ parentId: source._id })
    },
    isEdited: {
      type: 'Boolean!',
      description: 'Whether the comment has been edited',
      resolve: source => source.editHistory && source.editHistory.length > 0
    }
  }
});

// Add input validation
CommentTC.getInputTypeComposer().addValidator(value => {
  if (value.content) {
    if (value.content.length < 1) {
      throw new Error('Comment content cannot be empty');
    }
    if (value.content.length > 2000) {
      throw new Error('Comment content cannot exceed 2000 characters');
    }
  }
  
  if (value.reactions) {
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    value.reactions.forEach(reaction => {
      if (!validTypes.includes(reaction.type)) {
        throw new Error(`Invalid reaction type: ${reaction.type}`);
      }
    });
  }
}); 