/**
 * Event domain model operation helpers
 * @module domain-services/events/lib/model-ops
 */

import { NotFoundError } from '../../../lib/errors.js';

/**
 * Find a single document with tenant scope
 * @param {Object} context - Operation context
 * @param {string} modelName - Model name in context.services.db
 * @param {Object} query - Query conditions
 * @returns {Promise<Object>} Found document
 * @throws {NotFoundError} If document not found
 */
export const findOneInTenant = async (context, modelName, query) => {
  const doc = await context.services.db[modelName].findOne({
    ...query,
    tenantId: context.tenant.id
  });

  if (!doc) {
    throw new NotFoundError(`${modelName} not found`);
  }

  return doc;
};

/**
 * Create a document with tenant and user scope
 * @param {Object} context - Operation context
 * @param {string} modelName - Model name in context.services.db
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document
 */
export const createInTenant = async (context, modelName, data) => {
  const doc = new context.services.db[modelName]({
    ...data,
    tenantId: context.tenant.id,
    createdBy: context.user.id
  });

  await doc.save();
  return doc;
};

/**
 * Update a document with tenant scope
 * @param {Object} context - Operation context
 * @param {Object} doc - Document to update
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated document
 */
export const updateDocument = async (context, doc, data) => {
  Object.assign(doc, {
    ...data,
    updatedBy: context.user.id
  });

  await doc.save();
  return doc;
};

/**
 * List documents with tenant scope and pagination
 * @param {Object} context - Operation context
 * @param {string} modelName - Model name in context.services.db
 * @param {Object} filter - Filter criteria
 * @param {Object} options - List options
 * @returns {Promise<{items: Object[], total: number}>}
 */
export const listInTenant = async (context, modelName, filter = {}, options = {}) => {
  const query = {
    ...filter,
    tenantId: context.tenant.id
  };

  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    context.services.db[modelName].find(query).skip(skip).limit(limit),
    context.services.db[modelName].countDocuments(query)
  ]);

  return { items, total };
}; 