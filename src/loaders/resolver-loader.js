import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for resolvers
const RESOLVER_PATTERNS = {
  default: '**/*-resolvers.js',
  index: '**/resolvers/index.js'
};

// Resolver validation schema
const resolverSchema = {
  name: String,
  methods: Object,
  meta: Object,
  options: Object
};

// Resolver validation
const validateResolver = (module) => {
  const { name, methods } = module;
  return name && methods && typeof methods === 'object';
};

// Resolver transformation
const transformResolver = (module) => {
  const { name, methods, meta = {}, options = {} } = module;
  return {
    name,
    methods,
    meta,
    options,
    type: 'resolvers',
    timestamp: Date.now()
  };
};

// Create resolver loader
export const createResolverLoader = (options = {}) => {
  const loader = createLoader('resolvers', {
    ...options,
    patterns: RESOLVER_PATTERNS,
    validate: validateResolver,
    transform: transformResolver
  });

  return loader;
}; 