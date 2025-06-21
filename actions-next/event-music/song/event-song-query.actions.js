// Define configuration and library-specific logic at the top
import R from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import sanitizeSong from '../lib/sanitizeSong.js';

/**
 * Error messages for song actions.
 */
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

/**
 * Get a song by its ID.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.id - The song ID.
 * @returns {Promise<Object|null>}
 */
const getSongById = async ({ context, id }) => {
  if (!isNotNilOrEmpty(id)) throw new Error(ERRORS.INVALID_INPUT);
  const { Song } = context.models;
  const song = await Song.findById(id).lean().exec();
  return song ? sanitizeSong(song) : null;
};

/**
 * List all songs matching a filter.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {Object} [params.filter] - MongoDB filter object.
 * @returns {Promise<Array>}
 */
const listSongs = async ({ context, filter = {} }) => {
  const { Song } = context.models;
  const songs = await Song.find(filter).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

/**
 * Search for songs by title, artist, or album.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.query - Search string.
 * @param {number} [params.limit=10] - Max results.
 * @param {number} [params.offset=0] - Offset for pagination.
 * @returns {Promise<Object>} - { songs: Array, pagination: Object }
 */
const searchSongs = async ({ context, query, limit = 10, offset = 0 }) => {
  if (!isNotNilOrEmpty(query)) throw new Error(ERRORS.INVALID_INPUT);
  const { Song } = context.models;
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { artist: { $regex: query, $options: 'i' } },
      { album: { $regex: query, $options: 'i' } }
    ]
  };
  const [songs, total] = await Promise.all([
    Song.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Song.countDocuments(searchQuery)
  ]);
  return {
    songs: R.map(sanitizeSong, songs || []),
    pagination: { total, limit, offset }
  };
};

/**
 * Get all songs by status.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.status - Song status.
 * @returns {Promise<Array>}
 */
const getSongsByStatus = async ({ context, status }) => {
  if (!isNotNilOrEmpty(status)) throw new Error(ERRORS.INVALID_INPUT);
  const { Song } = context.models;
  const songs = await Song.find({ status }).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

/**
 * Get all songs by artist.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.artist - Artist name or ID.
 * @returns {Promise<Array>}
 */
const getSongsByArtist = async ({ context, artist }) => {
  if (!isNotNilOrEmpty(artist)) throw new Error(ERRORS.INVALID_INPUT);
  const { Song } = context.models;
  const songs = await Song.find({ artist }).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

/**
 * Get top rated songs by average rating.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {number} [params.limit=10] - Max results.
 * @returns {Promise<Array>}
 */
const getTopRatedSongs = async ({ context, limit = 10 }) => {
  const { Song } = context.models;
  const songs = await Song.aggregate([
    { $addFields: { avgRating: { $avg: '$ratings.value' } } },
    { $sort: { avgRating: -1 } },
    { $limit: limit }
  ]);
  return R.map(sanitizeSong, songs || []);
};

/**
 * Get most played songs.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {number} [params.limit=10] - Max results.
 * @returns {Promise<Array>}
 */
const getMostPlayedSongs = async ({ context, limit = 10 }) => {
  const { Song } = context.models;
  const songs = await Song.find().sort({ playCount: -1 }).limit(limit).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

/**
 * Get most recently created songs.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {number} [params.limit=10] - Max results.
 * @returns {Promise<Array>}
 */
const getRecentSongs = async ({ context, limit = 10 }) => {
  const { Song } = context.models;
  const songs = await Song.find().sort({ createdAt: -1 }).limit(limit).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

/**
 * Get all songs by album.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.album - Album name or ID.
 * @returns {Promise<Array>}
 */
const getSongsByAlbum = async ({ context, album }) => {
  if (!isNotNilOrEmpty(album)) throw new Error(ERRORS.INVALID_INPUT);
  const { Song } = context.models;
  const songs = await Song.find({ album }).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

/**
 * Get all songs by genre.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.genre - Genre name.
 * @returns {Promise<Array>}
 */
const getSongsByGenre = async ({ context, genre }) => {
  if (!isNotNilOrEmpty(genre)) throw new Error(ERRORS.INVALID_INPUT);
  const { Song } = context.models;
  const songs = await Song.find({ genre }).lean().exec();
  return R.map(sanitizeSong, songs || []);
};

export default withNamespace('eventSong', {
  getSongById: {
    method: getSongById,
    meta: { audit: true, cache: { ttl: '1m' } }
  },
  listSongs: {
    method: listSongs,
    meta: { cache: { ttl: '30s' } }
  },
  searchSongs: {
    method: searchSongs,
    meta: { audit: true, cache: { ttl: '1m' } }
  },
  getSongsByStatus: {
    method: getSongsByStatus,
    meta: { cache: { ttl: '2m' } }
  },
  getSongsByArtist: {
    method: getSongsByArtist,
    meta: { cache: { ttl: '2m' } }
  },
  getTopRatedSongs: {
    method: getTopRatedSongs,
    meta: { cache: { ttl: '2m' } }
  },
  getMostPlayedSongs: {
    method: getMostPlayedSongs,
    meta: { cache: { ttl: '2m' } }
  },
  getRecentSongs: {
    method: getRecentSongs,
    meta: { cache: { ttl: '2m' } }
  },
  getSongsByAlbum: {
    method: getSongsByAlbum,
    meta: { cache: { ttl: '2m' } }
  },
  getSongsByGenre: {
    method: getSongsByGenre,
    meta: { cache: { ttl: '2m' } }
  }
});
