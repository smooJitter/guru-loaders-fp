import { createLoader } from '../../utils/loader-utils.js';
import { getLoaderLogger } from '../../utils/loader-logger.js';
import { SchemaComposer } from 'graphql-compose';

const TYPE_COMPOSER_PATTERNS = [
  'src/**/*.tc.js',
  'src/**/*.type-composer.js',
  'src/features/*/*.tc.js',
  'src/features/*/*.type-composer.js',
];

// Map of Mongoose types to GraphQL types
const TYPE_MAP = {
  String: 'String',
  Number: 'Float',
  Boolean: 'Boolean',
  Date: 'Date',
  Buffer: 'Buffer',
  Object: 'JSON',
  ObjectId: 'ID',
  Mixed: 'JSON',
  Decimal128: 'Float',
  Map: 'JSON',
};

/**
 * Gets the field type configuration for a mongoose field
 * @param {string} fieldName - The name of the field
 * @param {object} field - The mongoose field definition
 * @param {object} logger - The logger instance
 * @returns {object} The field type configuration
 */
const getFieldTypeConfig = (fieldName, field, logger) => {
  try {
    if (!field) {
      logger.warn(`[type-composer-loader] Invalid field definition for ${fieldName}`);
      return { type: 'String' };
    }

    // Handle array types
    if (field.instance === 'Array' || (field.type && Array.isArray(field.type))) {
      const itemType = field.caster ? field.caster.instance : 'String';
      const baseType = TYPE_MAP[itemType] || 'String';
      return { type: `[${baseType}]` };
    }

    // Handle references
    if (field.instance === 'ObjectID' || field.ref) {
      return { type: 'ID' };
    }

    // Handle regular types
    const baseType = field.instance || (field.type && field.type.name) || field.type || field;
    const mappedType = TYPE_MAP[baseType] || 'String';
    
    return { 
      type: mappedType,
      ...(field.required && { nonNull: true })
    };
  } catch (err) {
    logger.error(`[type-composer-loader] Error getting field type for ${fieldName}:`, err);
    return { type: 'String' };
  }
};

/**
 * Validates a mongoose model and returns its schema fields
 * @param {string} modelName - The name of the model
 * @param {object} model - The mongoose model
 * @param {object} logger - The logger instance
 * @returns {object|null} The model schema fields or null if invalid
 */
const validateModel = (modelName, model, logger) => {
  try {
    // Handle case where model is a mongoose model
    if (model && typeof model === 'function' && model.schema) {
      return model.schema.tree;
    }

    // Handle case where model is a schema directly
    if (model && model.constructor && model.constructor.name === 'Schema') {
      return model.tree;
    }

    // Handle case where model is a schema definition
    if (model && typeof model === 'object' && !model.schema && !model.obj) {
      return model;
    }

    logger.warn(`[type-composer-loader] Invalid model: ${modelName}`);
    return null;
  } catch (err) {
    logger.error(`[type-composer-loader] Error validating model ${modelName}:`, err);
    return null;
  }
};

/**
 * Transform: For each typeComposer file, import and execute its default export as a factory with context.
 * The factory should check/create/extend the relevant TypeComposer in context.typeComposers.
 * @param {object} module - The imported module
 * @param {object} ctx - The loader context
 * @returns {object} The updated typeComposers registry
 */
const transformTypeComposer = async (modules, ctx) => {
  const logger = getLoaderLogger(ctx, {}, 'type-composer-loader');

  // Validate input
  if (!ctx || typeof ctx !== 'object') {
    throw new Error('[type-composer-loader] Invalid context provided');
  }

  // Initialize context with SchemaComposer if not present
  if (!ctx.schemaComposer) {
    ctx.schemaComposer = new SchemaComposer();
  }
  if (!ctx.typeComposers) {
    ctx.typeComposers = {};
  }

  // Process each model if provided
  if (ctx.models && typeof ctx.models === 'object') {
    if (Object.keys(ctx.models).length === 0) {
      throw new Error('[type-composer-loader] No models provided');
    }

    for (const [modelName, model] of Object.entries(ctx.models)) {
      try {
        const fields = validateModel(modelName, model, logger);
        if (!fields) continue;

        // Create TypeComposer
        const typeComposer = ctx.schemaComposer.createObjectTC({
          name: modelName,
          fields: Object.entries(fields).reduce((acc, [fieldName, field]) => {
            if (fieldName === '_id') return acc; // Skip _id field
            acc[fieldName] = getFieldTypeConfig(fieldName, field, logger);
            return acc;
          }, {})
        });

        // Check for duplicates
        if (ctx.typeComposers[modelName]) {
          logger.warn(`[type-composer-loader] Duplicate typeComposer name: ${modelName}`);
        }

        ctx.typeComposers[modelName] = typeComposer;
      } catch (err) {
        logger.error(`[type-composer-loader] Error creating typeComposer for ${modelName}:`, err);
        throw new Error(`Failed to create typeComposer for ${modelName}: ${err.message}`);
      }
    }
  }

  // Process plugins
  if (ctx.plugins) {
    if (!Array.isArray(ctx.plugins)) {
      throw new Error('[type-composer-loader] Plugins must be an array');
    }

    for (const plugin of ctx.plugins) {
      if (typeof plugin !== 'function') {
        logger.warn('[type-composer-loader] Invalid plugin: must be a function');
        continue;
      }

      try {
        await plugin({
          schemaComposer: ctx.schemaComposer,
          typeComposers: ctx.typeComposers,
          context: ctx
        });
      } catch (err) {
        logger.error('[type-composer-loader] Plugin error:', err);
        throw err; // Preserve original error for better stack trace
      }
    }
  }

  return ctx.typeComposers;
};

/**
 * Validate: Ensure the module exports a default function
 * @param {string} type - The loader type ("typeComposers")
 * @param {object} module - The imported module
 * @returns {boolean} True if valid, false otherwise
 */
const validateTypeComposerModule = (type, module) => {
  return module && typeof module.default === 'function';
};

/**
 * Create the type-composer loader (file-based, context-driven)
 * @param {object} options - Loader options
 * @returns {function} Loader function
 */
export const createTypeComposerLoader2 = (options = {}) =>
  createLoader('typeComposers', {
    patterns: options.patterns || TYPE_COMPOSER_PATTERNS,
    ...options,
    transform: options.transform || transformTypeComposer,
    validate: options.validate || validateTypeComposerModule,
  });

/**
 * The main typeComposer loader function
 * @param {object} ctx - The loader context
 * @returns {Promise<object>} The loaded typeComposers and schemaComposer
 */
export const typeComposerLoader = async (ctx = {}) => {
  // Initialize context
  if (!ctx.typeComposers) {
    ctx.typeComposers = {};
  }
  if (!ctx.schemaComposer) {
    ctx.schemaComposer = new SchemaComposer();
  }

  // Validate models
  if (!ctx.models) {
    throw new Error('[type-composer-loader] No models provided');
  }

  const options = ctx.options || {};
  const loader = createTypeComposerLoader2({
    findFiles: options.findFiles,
    importModule: options.importModule,
    patterns: options.patterns
  });

  const { context } = await loader(ctx);

  return {
    context,
    schemaComposer: context.schemaComposer,
    typeComposers: context.typeComposers
  };
};

export default typeComposerLoader; 