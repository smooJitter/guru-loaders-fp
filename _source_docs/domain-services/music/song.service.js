import { withErrorHandling } from '../utils/errorHandling.js';
import { ValidationError, NotFoundError } from '../../lib/errors.js';
import { SONG_STATUS, ERRORS, EVENTS } from './config/constants.js';

/**
 * Create a new song
 * @param {Object} context Service context
 * @param {Object} data Song data
 * @returns {Promise<Object>} Created song
 */
export const createSong = withErrorHandling(async (context, data) => {
  const { title, artist, album, duration, genre, coverImage } = data;

  // Validation
  if (!title || !artist) {
    throw new ValidationError(ERRORS.REQUIRED_FIELDS);
  }

  // Create song
  const song = await context.services.db.Song.create({
    title,
    artist,
    album,
    duration,
    genre,
    coverImage,
    status: SONG_STATUS.ACTIVE,
    playCount: 0,
    ratings: []
  });

  // Emit event
  await context.services.events.emit(EVENTS.SONG_CREATED, {
    songId: song._id,
    title: song.title,
    artist: song.artist
  });

  return song;
});

/**
 * Get song by ID
 * @param {Object} context Service context
 * @param {string} id Song ID
 * @returns {Promise<Object>} Song object
 */
export const getSongById = withErrorHandling(async (context, id) => {
  const song = await context.services.db.Song.findById(id)
    .populate('artist')
    .populate('album')
    .lean()
    .exec();

  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(id));
  }

  return song;
});

/**
 * List songs with pagination and filtering
 * @param {Object} context Service context
 * @param {Object} options Query options
 * @returns {Promise<Object>} List of songs and pagination info
 */
export const listSongs = withErrorHandling(async (context, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    genre,
    artist,
    status
  } = options;

  const query = {};
  if (genre) query.genre = genre;
  if (artist) query.artist = artist;
  if (status) query.status = status;

  const [songs, total] = await Promise.all([
    context.services.db.Song.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('artist')
      .populate('album')
      .lean()
      .exec(),
    context.services.db.Song.countDocuments(query)
  ]);

  return {
    songs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
});

/**
 * Update song
 * @param {Object} context Service context
 * @param {string} id Song ID
 * @param {Object} updates Update data
 * @returns {Promise<Object>} Updated song
 */
export const updateSong = withErrorHandling(async (context, id, updates) => {
  const song = await context.services.db.Song.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(id));
  }

  await context.services.events.emit(EVENTS.SONG_UPDATED, {
    songId: song._id,
    updates
  });

  return song;
});

/**
 * Update song status
 * @param {Object} context Service context
 * @param {string} id Song ID
 * @param {string} status New status
 * @returns {Promise<Object>} Updated song
 */
export const updateSongStatus = withErrorHandling(async (context, id, status) => {
  if (!Object.values(SONG_STATUS).includes(status)) {
    throw new ValidationError(ERRORS.INVALID_STATUS);
  }

  const song = await context.services.db.Song.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).lean();

  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(id));
  }

  await context.services.events.emit(EVENTS.SONG_STATUS_UPDATED, {
    songId: song._id,
    status
  });

  return song;
});

/**
 * Increment play count
 * @param {Object} context Service context
 * @param {string} id Song ID
 * @returns {Promise<Object>} Updated song
 */
export const incrementPlayCount = withErrorHandling(async (context, id) => {
  const song = await context.services.db.Song.findByIdAndUpdate(
    id,
    {
      $inc: { playCount: 1 },
      $set: { lastPlayedAt: new Date() }
    },
    { new: true }
  ).lean();

  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(id));
  }

  await context.services.events.emit(EVENTS.SONG_PLAYED, {
    songId: song._id,
    playCount: song.playCount
  });

  return song;
});

/**
 * Add rating to song
 * @param {Object} context Service context
 * @param {string} id Song ID
 * @param {Object} rating Rating data
 * @returns {Promise<Object>} Updated song
 */
export const addRating = withErrorHandling(async (context, id, rating) => {
  const { userId, value, type = 'user' } = rating;

  if (!userId || !value || value < 1 || value > 5) {
    throw new ValidationError(ERRORS.INVALID_RATING);
  }

  const song = await context.services.db.Song.findByIdAndUpdate(
    id,
    {
      $push: {
        ratings: {
          userId,
          value,
          type,
          createdAt: new Date()
        }
      }
    },
    { new: true }
  ).lean();

  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(id));
  }

  await context.services.events.emit(EVENTS.SONG_RATED, {
    songId: song._id,
    userId,
    value,
    type
  });

  return song;
});

/**
 * Search songs
 * @param {Object} context Service context
 * @param {string} query Search query
 * @param {Object} options Search options
 * @returns {Promise<Object>} Search results
 */
export const searchSongs = withErrorHandling(async (context, query, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = options;

  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { genre: { $regex: query, $options: 'i' } }
    ]
  };

  const [songs, total] = await Promise.all([
    context.services.db.Song.find(searchQuery)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('artist')
      .populate('album')
      .lean()
      .exec(),
    context.services.db.Song.countDocuments(searchQuery)
  ]);

  return {
    songs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
});

/**
 * Get song analytics
 * @param {Object} context Service context
 * @param {Object} options Analytics options
 * @returns {Promise<Object>} Analytics data
 */
export const getSongAnalytics = withErrorHandling(async (context, options = {}) => {
  const { startDate, endDate, groupBy = 'day' } = options;
  
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const analytics = await context.services.db.Song.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
            date: '$createdAt'
          }
        },
        totalSongs: { $sum: 1 },
        totalPlays: { $sum: '$playCount' },
        avgRating: { $avg: { $avg: '$ratings.value' } },
        genres: { $addToSet: '$genre' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return analytics;
});

/**
 * Get top songs
 * @param {Object} context Service context
 * @param {Object} options Query options
 * @returns {Promise<Object[]>} Top songs
 */
export const getTopSongs = withErrorHandling(async (context, options = {}) => {
  const {
    limit = 10,
    timeRange = 'all',
    sortBy = 'playCount'
  } = options;

  const matchStage = {};
  if (timeRange !== 'all') {
    const date = new Date();
    switch (timeRange) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    matchStage.createdAt = { $gte: date };
  }

  const sortStage = {};
  sortStage[sortBy] = -1;

  const songs = await context.services.db.Song.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        avgRating: { $avg: '$ratings.value' }
      }
    },
    { $sort: sortStage },
    { $limit: limit },
    {
      $lookup: {
        from: 'artists',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistDetails'
      }
    },
    {
      $lookup: {
        from: 'albums',
        localField: 'album',
        foreignField: '_id',
        as: 'albumDetails'
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        artist: { $arrayElemAt: ['$artistDetails', 0] },
        album: { $arrayElemAt: ['$albumDetails', 0] },
        playCount: 1,
        avgRating: 1,
        genre: 1,
        coverImage: 1
      }
    }
  ]);

  return songs;
});

/**
 * Get genre statistics
 * @param {Object} context Service context
 * @returns {Promise<Object[]>} Genre statistics
 */
export const getGenreStats = withErrorHandling(async (context) => {
  const stats = await context.services.db.Song.aggregate([
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 },
        totalPlays: { $sum: '$playCount' },
        avgRating: { $avg: { $avg: '$ratings.value' } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return stats;
});

/**
 * Get artist performance metrics
 * @param {Object} context Service context
 * @param {string} artistId Artist ID
 * @returns {Promise<Object>} Artist metrics
 */
export const getArtistMetrics = withErrorHandling(async (context, artistId) => {
  const metrics = await context.services.db.Song.aggregate([
    { $match: { artist: artistId } },
    {
      $group: {
        _id: null,
        totalSongs: { $sum: 1 },
        totalPlays: { $sum: '$playCount' },
        avgRating: { $avg: { $avg: '$ratings.value' } },
        genres: { $addToSet: '$genre' },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);

  return metrics[0] || {
    totalSongs: 0,
    totalPlays: 0,
    avgRating: 0,
    genres: [],
    totalDuration: 0
  };
});

/**
 * Get trending songs
 * @param {Object} context Service context
 * @param {Object} options Query options
 * @returns {Promise<Object[]>} Trending songs
 */
export const getTrendingSongs = withErrorHandling(async (context, options = {}) => {
  const { limit = 10, timeWindow = 7 } = options;
  
  const date = new Date();
  date.setDate(date.getDate() - timeWindow);

  const songs = await context.services.db.Song.aggregate([
    {
      $match: {
        lastPlayedAt: { $gte: date }
      }
    },
    {
      $addFields: {
        playVelocity: {
          $divide: ['$playCount', timeWindow]
        }
      }
    },
    { $sort: { playVelocity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'artists',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistDetails'
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        artist: { $arrayElemAt: ['$artistDetails', 0] },
        playCount: 1,
        playVelocity: 1,
        genre: 1,
        coverImage: 1
      }
    }
  ]);

  return songs;
}); 