import { withErrorHandling } from '../utils/errorHandling.js';
import { ValidationError, NotFoundError, InsufficientCreditsError } from '../../lib/errors.js';
import { ERRORS, EVENTS } from './config/constants.js';

/**
 * Create a song request from a swipe
 * @param {Object} context Service context
 * @param {Object} data Request data
 * @returns {Promise<Object>} Created request
 */
export const createRequestFromSwipe = withErrorHandling(async (context, data) => {
  const { userId, songId, swipeId, location, event } = data;

  // Validation
  if (!userId || !songId) {
    throw new ValidationError(ERRORS.REQUIRED_FIELDS);
  }

  // Check if user has enough credits
  const userCredits = await context.services.credits.getUserCredits(userId);
  if (userCredits < 1) {
    throw new InsufficientCreditsError(ERRORS.INSUFFICIENT_CREDITS);
  }

  // Check if song exists
  const song = await context.services.db.Song.findById(songId);
  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(songId));
  }

  // Check if user already has a pending request for this song
  const existingRequest = await context.services.db.SongRequest.findOne({
    userId,
    songId,
    status: 'pending'
  });

  if (existingRequest) {
    throw new ValidationError(ERRORS.DUPLICATE_REQUEST);
  }

  // Create request
  const request = await context.services.db.SongRequest.create({
    userId,
    songId,
    creditsSpent: 1,
    metadata: {
      swipeId,
      requestSource: 'swipe',
      location,
      event
    }
  });

  // Deduct credits
  await context.services.credits.deductCredits(userId, 1, {
    type: 'song_request',
    requestId: request._id
  });

  // Emit event
  await context.services.events.emit(EVENTS.SONG_REQUESTED, {
    userId,
    songId,
    requestId: request._id,
    creditsSpent: 1
  });

  return request;
});

/**
 * Get pending song requests
 * @param {Object} context Service context
 * @param {Object} options Query options
 * @returns {Promise<Object>} Pending requests with pagination
 */
export const getPendingRequests = withErrorHandling(async (context, options = {}) => {
  const { page = 1, limit = 20 } = options;

  const [requests, total] = await Promise.all([
    context.services.db.SongRequest.getPendingRequests(limit),
    context.services.db.SongRequest.countDocuments({ status: 'pending' })
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
});

/**
 * Get user's song requests
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @param {Object} options Query options
 * @returns {Promise<Object>} User's requests with pagination
 */
export const getUserRequests = withErrorHandling(async (context, userId, options = {}) => {
  const { page = 1, limit = 20, status } = options;

  const query = { userId };
  if (status) query.status = status;

  const [requests, total] = await Promise.all([
    context.services.db.SongRequest.find(query)
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('songId')
      .lean(),
    context.services.db.SongRequest.countDocuments(query)
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
});

/**
 * Approve a song request
 * @param {Object} context Service context
 * @param {string} requestId Request ID
 * @returns {Promise<Object>} Updated request
 */
export const approveRequest = withErrorHandling(async (context, requestId) => {
  const request = await context.services.db.SongRequest.findById(requestId);
  if (!request) {
    throw new NotFoundError(ERRORS.REQUEST_NOT_FOUND(requestId));
  }

  if (request.status !== 'pending') {
    throw new ValidationError(ERRORS.INVALID_REQUEST_STATUS);
  }

  await request.approve();

  // Emit event
  await context.services.events.emit(EVENTS.SONG_REQUEST_APPROVED, {
    requestId: request._id,
    userId: request.userId,
    songId: request.songId
  });

  return request;
});

/**
 * Reject a song request
 * @param {Object} context Service context
 * @param {string} requestId Request ID
 * @param {string} reason Rejection reason
 * @returns {Promise<Object>} Updated request
 */
export const rejectRequest = withErrorHandling(async (context, requestId, reason) => {
  const request = await context.services.db.SongRequest.findById(requestId);
  if (!request) {
    throw new NotFoundError(ERRORS.REQUEST_NOT_FOUND(requestId));
  }

  if (request.status !== 'pending') {
    throw new ValidationError(ERRORS.INVALID_REQUEST_STATUS);
  }

  await request.reject(reason);

  // Refund credits
  await context.services.credits.addCredits(request.userId, request.creditsSpent, {
    type: 'request_refund',
    requestId: request._id,
    reason
  });

  // Emit event
  await context.services.events.emit(EVENTS.SONG_REQUEST_REJECTED, {
    requestId: request._id,
    userId: request.userId,
    songId: request.songId,
    reason
  });

  return request;
});

/**
 * Mark a song request as played
 * @param {Object} context Service context
 * @param {string} requestId Request ID
 * @returns {Promise<Object>} Updated request
 */
export const markRequestAsPlayed = withErrorHandling(async (context, requestId) => {
  const request = await context.services.db.SongRequest.findById(requestId);
  if (!request) {
    throw new NotFoundError(ERRORS.REQUEST_NOT_FOUND(requestId));
  }

  if (request.status !== 'approved') {
    throw new ValidationError(ERRORS.INVALID_REQUEST_STATUS);
  }

  await request.markAsPlayed();

  // Emit event
  await context.services.events.emit(EVENTS.SONG_REQUEST_PLAYED, {
    requestId: request._id,
    userId: request.userId,
    songId: request.songId
  });

  return request;
});

/**
 * Get request statistics
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @returns {Promise<Object>} Request statistics
 */
export const getRequestStats = withErrorHandling(async (context, userId) => {
  const stats = await context.services.db.SongRequest.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        creditsSpent: { $sum: '$creditsSpent' }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    played: 0,
    totalCreditsSpent: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    result.totalCreditsSpent += stat.creditsSpent;
  });

  return result;
}); 