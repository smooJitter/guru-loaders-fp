import mongoose from 'mongoose';
import * as R from 'ramda';

// Pure Mongoose model helpers for use in models, tests, and business logic.
// Not an app-level service. Import directly from utils/db/model-utils.js.

/**
 * Higher-order function that creates a Mongoose model with enhanced functionality
 * @param {string} modelName - The name of the model
 * @param {mongoose.Schema} schema - The mongoose schema
 * @returns {mongoose.Model} Enhanced mongoose model
 */
export const withModel = (modelName, schema) => {
  // Check if model already exists to prevent duplicate model error
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  // Add timestamps by default if not already added
  if (!schema.get('timestamps')) {
    schema.set('timestamps', true);
  }

  // Add toJSON transform if not present
  if (!schema.get('toJSON')) {
    schema.set('toJSON', {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    });
  }

  // Create and return the model
  return mongoose.model(modelName, schema);
};

/**
 * Creates a session-aware model that automatically uses the provided session for operations
 * @param {mongoose.Model} model - The mongoose model to enhance
 * @param {mongoose.ClientSession} session - The mongoose session to use
 * @returns {mongoose.Model} Session-aware model
 */
export const withSession = (model, session) => {
  const sessionOptions = { session };
  
  return R.pipe(
    R.assoc('create', (...args) => model.create(args[0], sessionOptions)),
    R.assoc('find', (...args) => model.find(args[0], null, sessionOptions)),
    R.assoc('findOne', (...args) => model.findOne(args[0], null, sessionOptions)),
    R.assoc('findById', (...args) => model.findById(args[0], null, sessionOptions)),
    R.assoc('updateOne', (...args) => model.updateOne(args[0], args[1], { ...sessionOptions, ...args[2] })),
    R.assoc('updateMany', (...args) => model.updateMany(args[0], args[1], { ...sessionOptions, ...args[2] })),
    R.assoc('deleteOne', (...args) => model.deleteOne(args[0], sessionOptions)),
    R.assoc('deleteMany', (...args) => model.deleteMany(args[0], sessionOptions))
  )({});
};

/**
 * Creates a collection-aware model that automatically uses the provided collection
 * @param {mongoose.Model} model - The mongoose model to enhance
 * @returns {mongoose.Collection} The collection for the model
 */
export const withCollection = (model) => {
  if (!model.collection) throw new Error('Model has no collection');
  return model.collection;
};

/**
 * Creates a standardized query object for MongoDB operations
 * @param {Object} options Query options
 * @returns {Object} Standardized query object
 */
export const createQuery = ({
  filter = {},
  sort = {},
  limit = 0,
  skip = 0,
  select = {},
  populate = []
} = {}) => ({
  filter,
  sort,
  limit,
  skip,
  select,
  populate
}); 