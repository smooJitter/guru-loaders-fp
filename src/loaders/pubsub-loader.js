import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for pubsub
const PUBSUB_PATTERNS = {
  default: '**/pubsub-*.js',
  topics: '**/topics-*.js',
  index: '**/pubsub/index.js'
};

// PubSub validation schema
const pubsubSchema = {
  name: String,
  topics: Object,
  handlers: Object,
  options: Object
};

// PubSub validation
const validatePubsub = (module) => {
  const { name, topics, handlers } = module;
  return name && 
         topics && 
         typeof topics === 'object' &&
         handlers && 
         typeof handlers === 'object';
};

// PubSub transformation
const transformPubsub = (module) => {
  const { name, topics, handlers, options = {} } = module;
  
  return {
    name,
    topics,
    handlers,
    options,
    type: 'pubsub',
    timestamp: Date.now(),
    // Create PubSub instance
    create: (context) => {
      const { pubsub } = context.services;
      
      if (!pubsub) {
        throw new Error('PubSub service not found in context');
      }

      // Register topics
      const registeredTopics = {};
      Object.entries(topics).forEach(([key, value]) => {
        registeredTopics[key] = pubsub.asyncIterator(value);
      });

      // Register handlers
      const registeredHandlers = {};
      Object.entries(handlers).forEach(([topic, handler]) => {
        if (typeof handler === 'function') {
          registeredHandlers[topic] = async (payload) => {
            try {
              await handler(payload, context);
            } catch (error) {
              context.logger.error(`Error in ${name} handler for topic ${topic}:`, error);
              throw error;
            }
          };
        }
      });

      return {
        // Topic access
        topics: registeredTopics,
        // Handler access
        handlers: registeredHandlers,
        // Publish method
        publish: async (topic, payload) => {
          const topicName = topics[topic];
          if (!topicName) {
            throw new Error(`Topic ${topic} not found in ${name}`);
          }
          await pubsub.publish(topicName, payload);
        },
        // Subscribe method
        subscribe: (topic, callback) => {
          const topicName = topics[topic];
          if (!topicName) {
            throw new Error(`Topic ${topic} not found in ${name}`);
          }
          return pubsub.subscribe(topicName, callback);
        }
      };
    }
  };
};

// Create pubsub loader
export const createPubsubLoader = (options = {}) => {
  const loader = createLoader('pubsub', {
    ...options,
    patterns: PUBSUB_PATTERNS,
    validate: validatePubsub,
    transform: transformPubsub
  });

  return loader;
}; 