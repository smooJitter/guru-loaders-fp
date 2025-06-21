// Utility for building pagination metadata

/**
 * Build pagination metadata for a paginated query.
 * @param {number} total - Total number of items.
 * @param {number} page - Current page number.
 * @param {number} limit - Page size.
 * @returns {Object} Pagination meta object.
 */
export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit)
}); 