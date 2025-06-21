// Define configuration and library-specific logic at the top
import { withNamespace } from '../../../src/utils/with-namespace.js';
import { makeErrors, requireFound, safeEmit } from '../../utils/shared-action-utils.js';
import {
  createRequestFromSwipeSchema,
  approveRequestSchema,
  rejectRequestSchema,
  markRequestAsPlayedSchema,
  bulkApproveRequestsSchema,
  bulkRejectRequestsSchema
} from './validation.js';
import { validate } from '../../utils/validate.js';

const ERRORS = makeErrors('SongRequest');

const createRequestFromSwipe = async (input) => {
  const { context, userId, songId, swipeId, location, event } = await validate(createRequestFromSwipeSchema, input);
  const { SongRequest, Song } = context.models;
  const { creditsService, events } = context.services || {};
  const song = await Song.findById(songId);
  requireFound(song, ERRORS.NOT_FOUND(songId));
  const existingRequest = await SongRequest.findOne({ userId, songId, status: 'pending' });
  if (existingRequest) {
    throw new Error(ERRORS.DUPLICATE_REQUEST);
  }
  if (creditsService && (await creditsService.getUserCredits(userId)) < 1) {
    throw new Error(ERRORS.INSUFFICIENT_CREDITS);
  }
  const request = await SongRequest.create({
    userId,
    songId,
    creditsSpent: 1,
    metadata: { swipeId, requestSource: 'swipe', location, event }
  });
  if (creditsService) {
    await creditsService.deductCredits(userId, 1, { type: 'song_request', requestId: request._id });
  }
  await safeEmit(events, 'song.requested', { userId, songId, requestId: request._id, creditsSpent: 1 });
  return request;
};

const approveRequest = async (input) => {
  const { context, requestId } = await validate(approveRequestSchema, input);
  const { SongRequest } = context.models;
  const { events } = context.services || {};
  const request = await SongRequest.findById(requestId);
  requireFound(request, ERRORS.REQUEST_NOT_FOUND(requestId));
  if (request.status !== 'pending') {
    throw new Error(ERRORS.INVALID_REQUEST_STATUS);
  }
  await request.approve();
  await safeEmit(events, 'song.request.approved', { requestId: request._id, userId: request.userId, songId: request.songId });
  return request;
};

const rejectRequest = async (input) => {
  const { context, requestId, reason } = await validate(rejectRequestSchema, input);
  const { SongRequest } = context.models;
  const { events, creditsService } = context.services || {};
  const request = await SongRequest.findById(requestId);
  requireFound(request, ERRORS.REQUEST_NOT_FOUND(requestId));
  if (request.status !== 'pending') {
    throw new Error(ERRORS.INVALID_REQUEST_STATUS);
  }
  await request.reject(reason);
  if (creditsService) {
    await creditsService.addCredits(request.userId, request.creditsSpent, { type: 'request_refund', requestId: request._id, reason });
  }
  await safeEmit(events, 'song.request.rejected', { requestId: request._id, userId: request.userId, songId: request.songId, reason });
  return request;
};

const markRequestAsPlayed = async (input) => {
  const { context, requestId } = await validate(markRequestAsPlayedSchema, input);
  const { SongRequest } = context.models;
  const { events } = context.services || {};
  const request = await SongRequest.findById(requestId);
  requireFound(request, ERRORS.REQUEST_NOT_FOUND(requestId));
  if (request.status !== 'approved') {
    throw new Error(ERRORS.INVALID_REQUEST_STATUS);
  }
  await request.markAsPlayed();
  await safeEmit(events, 'song.request.played', { requestId: request._id, userId: request.userId, songId: request.songId });
  return request;
};

// Future-proofed: bulk and advanced mutations
const bulkApproveRequests = async (input) => {
  const { context, ids } = await validate(bulkApproveRequestsSchema, input);
  // TODO: Implement bulk approve
  return { success: true, count: ids.length };
};

const bulkRejectRequests = async (input) => {
  const { context, ids } = await validate(bulkRejectRequestsSchema, input);
  // TODO: Implement bulk reject
  return { success: true, count: ids.length };
};

export default withNamespace('eventSongRequest', {
  createRequestFromSwipe,
  approveRequest,
  rejectRequest,
  markRequestAsPlayed,
  bulkApproveRequests,
  bulkRejectRequests
});

export {
  createRequestFromSwipe,
  approveRequest,
  rejectRequest,
  markRequestAsPlayed,
  bulkApproveRequests,
  bulkRejectRequests
};
