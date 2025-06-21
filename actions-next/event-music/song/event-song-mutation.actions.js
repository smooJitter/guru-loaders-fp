// Define configuration and library-specific logic at the top
import { withNamespace } from '../../../src/utils/with-namespace.js';
import { makeErrors, requireFound, safeEmit } from '../../utils/shared-action-utils.js';
import {
  addRatingSchema,
  createSongSchema,
  updateSongSchema,
  updateSongStatusSchema,
  deleteSongSchema,
  incrementPlayCountSchema,
  bulkDeleteSongsSchema,
  restoreSongSchema
} from './validation.js';
import { validate } from '../../utils/validate.js';

const ERRORS = makeErrors('Song');

const SONG_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
};

const sanitizeSong = (song) => {
  // Logic to sanitize song (customize as needed)
  return song;
};

const createSong = async (input) => {
  const { context, ...data } = await validate(createSongSchema, input);
  const { Song } = context.models;
  const { events } = context.services || {};
  const song = await Song.create({ ...data, status: 'active', playCount: 0, ratings: [] });
  await safeEmit(events, 'song.created', { songId: song._id, title: song.title, artist: song.artist });
  return sanitizeSong(song.toObject ? song.toObject() : song);
};

const updateSong = async (input) => {
  const { context, id, update } = await validate(updateSongSchema, input);
  const { Song } = context.models;
  const song = await Song.findByIdAndUpdate(id, update, { new: true }).lean().exec();
  return song ? sanitizeSong(song) : null;
};

const updateSongStatus = async (input) => {
  const { context, id, status } = await validate(updateSongStatusSchema, input);
  const { Song } = context.models;
  const { events } = context.services || {};
  if (!Object.values(SONG_STATUS).includes(status)) {
    throw new Error(ERRORS.INVALID_STATUS);
  }
  const song = await Song.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  requireFound(song, ERRORS.NOT_FOUND(id));
  await safeEmit(events, 'song.status.updated', { songId: song._id, status });
  return sanitizeSong(song);
};

const deleteSong = async (input) => {
  const { context, id } = await validate(deleteSongSchema, input);
  const { Song } = context.models;
  const song = await Song.findByIdAndDelete(id).lean().exec();
  return song ? sanitizeSong(song) : null;
};

const addRating = async (input) => {
  const { context, id, rating } = await validate(addRatingSchema, input);
  const { Song } = context.models;
  const { events } = context.services || {};
  const { userId, value, type = 'user' } = rating;
  const song = await Song.findByIdAndUpdate(
    id,
    { $push: { ratings: { userId, value, type, createdAt: new Date() } } },
    { new: true }
  ).lean();
  requireFound(song, ERRORS.NOT_FOUND(id));
  await safeEmit(events, 'song.rated', { songId: song._id, userId, value, type });
  return sanitizeSong(song);
};

const incrementPlayCount = async (input) => {
  const { context, id } = await validate(incrementPlayCountSchema, input);
  const { Song } = context.models;
  const { events } = context.services || {};
  const song = await Song.findByIdAndUpdate(
    id,
    { $inc: { playCount: 1 }, $set: { lastPlayedAt: new Date() } },
    { new: true }
  ).lean();
  requireFound(song, ERRORS.NOT_FOUND(id));
  await safeEmit(events, 'song.played', { songId: song._id, playCount: song.playCount });
  return sanitizeSong(song);
};

const bulkDeleteSongs = async (input) => {
  const { context, ids } = await validate(bulkDeleteSongsSchema, input);
  // TODO: Implement bulk delete logic
  return { success: true, count: ids.length };
};

const restoreSong = async (input) => {
  const { context, id } = await validate(restoreSongSchema, input);
  // TODO: Implement restore logic
  return { success: true, id };
};

export default withNamespace('eventSong', {
  createSong,
  updateSong,
  updateSongStatus,
  deleteSong,
  addRating,
  incrementPlayCount,
  bulkDeleteSongs,
  restoreSong
});

export {
  addRating,
  createSong,
  updateSong,
  updateSongStatus,
  deleteSong,
  incrementPlayCount,
  bulkDeleteSongs,
  restoreSong
};
