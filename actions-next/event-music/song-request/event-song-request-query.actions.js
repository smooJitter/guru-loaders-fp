import R from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { buildPaginationMeta } from '../lib/pagination.js';

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

/**
 * Get all song requests for a user, with optional status and pagination.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @param {number} [params.page=1] - Page number.
 * @param {number} [params.limit=20] - Page size.
 * @param {string} [params.status] - Request status.
 * @returns {Promise<Object>}
 */
const getUserRequests = async ({ context, userId, page = 1, limit = 20, status }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongRequest } = context.models;
  const query = { userId };
  if (status) query.status = status;
  const [requests, total] = await Promise.all([
    SongRequest.find(query).sort({ requestedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('songId').lean(),
    SongRequest.countDocuments(query)
  ]);
  return {
    requests: R.defaultTo([], requests),
    pagination: buildPaginationMeta(total, page, limit)
  };
};

/**
 * Get all pending song requests, paginated.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {number} [params.page=1] - Page number.
 * @param {number} [params.limit=20] - Page size.
 * @returns {Promise<Object>}
 */
const getPendingRequests = async ({ context, page = 1, limit = 20 }) => {
  const { SongRequest } = context.models;
  const requests = SongRequest.getPendingRequests
    ? await SongRequest.getPendingRequests(limit)
    : await SongRequest.find({ status: 'pending' }).sort({ requestedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('songId').lean();
  const total = await SongRequest.countDocuments({ status: 'pending' });
  return {
    requests: R.defaultTo([], requests),
    pagination: buildPaginationMeta(total, page, limit)
  };
};

/**
 * Advanced query: get requests by status (future-proofed).
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.status - Request status.
 * @returns {Promise<Array>}
 */
const getRequestsByStatus = async ({ context, status }) => {
  // TODO: Implement advanced query by status
  return [];
};

/**
 * Advanced query: get requests by song (future-proofed).
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.songId - Song ID.
 * @returns {Promise<Array>}
 */
const getRequestsBySong = async ({ context, songId }) => {
  // TODO: Implement advanced query by song
  return [];
};

export default withNamespace('eventSongRequest', {
  getUserRequests: {
    method: getUserRequests,
    meta: { audit: true, cache: { ttl: '1m' } }
  },
  getPendingRequests: {
    method: getPendingRequests,
    meta: { cache: { ttl: '1m' } }
  },
  getRequestsByStatus: {
    method: getRequestsByStatus
  },
  getRequestsBySong: {
    method: getRequestsBySong
  }
});
