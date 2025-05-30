import R from 'ramda';
import { createLoader } from '../core/pipeline/create-pipeline.js';
import { pipeAsync } from '../utils/fp-utils.js';

// File patterns for actions
const ACTION_PATTERNS = {
  default: '**/*-actions.js',
  index: '**/actions/index.js'
};

// Action validation schema
const actionSchema = {
  name: String,
  methods: Object,
  meta: Object,
  options: Object
};

// Action validation
const validateAction = (module) => {
  const { name, methods } = module;
  return name && methods && typeof methods === 'object';
};

// Action transformation
const transformAction = (module) => {
  const { name, methods, meta = {}, options = {} } = module;
  return {
    name,
    methods,
    meta,
    options,
    type: 'actions',
    timestamp: Date.now()
  };
};

// Create action loader
export const createActionLoader = (options = {}) => {
  const loader = createLoader('actions', {
    ...options,
    patterns: ACTION_PATTERNS,
    validate: validateAction,
    transform: transformAction
  });

  return loader;
}; 