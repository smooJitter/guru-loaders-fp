import { createLoader } from '../core/pipeline/create-pipeline.js';

// Event patterns for file discovery
const EVENT_PATTERNS = {
  default: '**/events/**/*.event.js',
  index: '**/events/index.js'
};

// Event validation schema
const eventSchema = {
  name: String,
  handler: Function,
  options: Object
};

// Event validation
const validateEvent = (module) => {
  const { name, handler } = module;
  return name && typeof handler === 'function';
};

// Event transformation
const transformEvent = (module) => {
  const { name, handler, options = {} } = module;
  return {
    name,
    handler,
    options,
    type: 'event',
    timestamp: Date.now()
  };
};

// Create event loader
export const createEventLoader = (options = {}) => {
  const loader = createLoader('event', {
    ...options,
    patterns: EVENT_PATTERNS,
    validate: validateEvent,
    transform: transformEvent
  });

  return loader;
}; 