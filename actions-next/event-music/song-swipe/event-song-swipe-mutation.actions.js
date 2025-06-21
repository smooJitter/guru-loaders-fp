// Define configuration and library-specific logic at the top
import { withNamespace } from '../../../src/utils/with-namespace.js';
import { makeErrors, requireFound, safeEmit } from '../../utils/shared-action-utils.js';
import {
  createSwipeSchema,
  bulkCreateSwipesSchema,
  undoSwipeSchema
} from './validation.js';
import { validate } from '../../utils/validate.js';

const ERRORS = makeErrors('Song');

// Private helper for swipe creation
const _createSwipe = async (context, data, direction) => {
  const { SongSwipe, Song } = context.models;
  const { userId, songId, reason, location, event } = data;
  const song = await Song.findById(songId);
  requireFound(song, ERRORS.NOT_FOUND(songId));
  const swipe = await SongSwipe.create({ userId, songId, direction, reason, timestamp: new Date() });
  // If direction is 'up', handle song request creation (stubbed for now)
  if (direction === 'up') {
    // TODO: Integrate songRequestService if needed
    // await context.services.songRequestService.createRequestFromSwipe({ userId, songId, swipeId: swipe._id, location, event });
  }
  // TODO: Emit event if needed
  return swipe;
};

const createSwipeRight = async (input) => {
  const { context, ...data } = await validate(createSwipeSchema, input);
  return _createSwipe(context, data, 'right');
};
const createSwipeLeft = async (input) => {
  const { context, ...data } = await validate(createSwipeSchema, input);
  return _createSwipe(context, data, 'left');
};
const createSwipeUp = async (input) => {
  const { context, ...data } = await validate(createSwipeSchema, input);
  return _createSwipe(context, data, 'up');
};

const bulkCreateSwipes = async (input) => {
  const { context, swipes } = await validate(bulkCreateSwipesSchema, input);
  // TODO: Implement bulk create swipes
  return { success: true, count: swipes.length };
};
const undoSwipe = async (input) => {
  const { context, swipeId } = await validate(undoSwipeSchema, input);
  // TODO: Implement undo swipe
  return { success: true, swipeId };
};

export default withNamespace('eventSongSwipe', {
  createSwipeRight,
  createSwipeLeft,
  createSwipeUp,
  bulkCreateSwipes,
  undoSwipe
});

export {
  createSwipeRight,
  createSwipeLeft,
  createSwipeUp,
  bulkCreateSwipes,
  undoSwipe
};
