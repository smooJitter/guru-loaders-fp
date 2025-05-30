import { withErrorHandling } from '../utils/errorHandling.js';
import { ValidationError, NotFoundError } from '../../lib/errors.js';
import { ERRORS, EVENTS } from './config/constants.js';

/**
 * Create a new song swipe
 * @param {Object} context Service context
 * @param {Object} data Swipe data
 * @returns {Promise<Object>} Created swipe
 */
export const createSwipe = withErrorHandling(async (context, data) => {
  const { userId, songId, direction, reason, location, event } = data;

  // Validation
  if (!userId || !songId || !direction) {
    throw new ValidationError(ERRORS.REQUIRED_FIELDS);
  }

  if (!['left', 'right', 'up'].includes(direction)) {
    throw new ValidationError(ERRORS.INVALID_SWIPE_DIRECTION);
  }

  // Check if song exists
  const song = await context.services.db.Song.findById(songId);
  if (!song) {
    throw new NotFoundError(ERRORS.SONG_NOT_FOUND(songId));
  }

  // Create swipe
  const swipe = await context.services.db.SongSwipe.create({
    userId,
    songId,
    direction,
    reason,
    timestamp: new Date()
  });

  // If swipe is up, create a song request
  if (direction === 'up') {
    try {
      await context.services.songRequest.createRequestFromSwipe({
        userId,
        songId,
        swipeId: swipe._id,
        location,
        event
      });
    } catch (error) {
      // If request creation fails, delete the swipe
      await context.services.db.SongSwipe.findByIdAndDelete(swipe._id);
      throw error;
    }
  }

  // Emit event
  await context.services.events.emit(EVENTS.SONG_SWIPED, {
    userId,
    songId,
    direction,
    swipeId: swipe._id
  });

  return swipe;
});

/**
 * Get user's swipe history
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @param {Object} options Query options
 * @returns {Promise<Object>} Swipe history with pagination
 */
export const getSwipeHistory = withErrorHandling(async (context, userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    direction,
    startDate,
    endDate
  } = options;

  const query = { userId };
  if (direction) query.direction = direction;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const [swipes, total] = await Promise.all([
    context.services.db.SongSwipe.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('songId')
      .lean()
      .exec(),
    context.services.db.SongSwipe.countDocuments(query)
  ]);

  return {
    swipes,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
});

/**
 * Get swipe statistics for a user
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @returns {Promise<Object>} Swipe statistics
 */
export const getSwipeStats = withErrorHandling(async (context, userId) => {
  const stats = await context.services.db.SongSwipe.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$direction',
        count: { $sum: 1 },
        songs: { $addToSet: '$songId' }
      }
    }
  ]);

  const result = {
    total: 0,
    left: 0,
    right: 0,
    uniqueSongs: new Set()
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    stat.songs.forEach(songId => result.uniqueSongs.add(songId));
  });

  result.uniqueSongs = result.uniqueSongs.size;

  return result;
});

/**
 * Get song swipe analytics
 * @param {Object} context Service context
 * @param {string} songId Song ID
 * @returns {Promise<Object>} Song swipe analytics
 */
export const getSongSwipeAnalytics = withErrorHandling(async (context, songId) => {
  const analytics = await context.services.db.SongSwipe.aggregate([
    { $match: { songId } },
    {
      $group: {
        _id: '$direction',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    }
  ]);

  const result = {
    total: 0,
    left: 0,
    right: 0,
    uniqueUsers: 0,
    matchRate: 0
  };

  analytics.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    result.uniqueUsers = Math.max(result.uniqueUsers, stat.uniqueUsers.length);
  });

  if (result.total > 0) {
    result.matchRate = (result.right / result.total) * 100;
  }

  return result;
});

/**
 * Get user's swipe recommendations
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @param {Object} options Query options
 * @returns {Promise<Object[]>} Recommended songs
 */
export const getSwipeRecommendations = withErrorHandling(async (context, userId, options = {}) => {
  const { limit = 10 } = options;

  // Get user's swipe history
  const userSwipes = await context.services.db.SongSwipe.find({ userId })
    .select('songId direction')
    .lean();

  // Get liked genres
  const likedSongs = userSwipes
    .filter(swipe => swipe.direction === 'right')
    .map(swipe => swipe.songId);

  const genreStats = await context.services.db.Song.aggregate([
    { $match: { _id: { $in: likedSongs } } },
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const topGenres = genreStats.slice(0, 3).map(stat => stat._id);

  // Get recommended songs
  const recommendations = await context.services.db.Song.aggregate([
    {
      $match: {
        _id: { $nin: userSwipes.map(swipe => swipe.songId) },
        genre: { $in: topGenres }
      }
    },
    {
      $addFields: {
        genreMatch: {
          $cond: [{ $in: ['$genre', topGenres] }, 1, 0]
        }
      }
    },
    { $sort: { genreMatch: -1, playCount: -1 } },
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
        genre: 1,
        coverImage: 1,
        playCount: 1
      }
    }
  ]);

  return recommendations;
});

/**
 * Get user's swipe matches (songs that were swiped right by both users)
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @param {string} otherUserId Other user ID
 * @returns {Promise<Object[]>} Matching songs
 */
export const getUserSwipeMatches = withErrorHandling(async (context, userId, otherUserId) => {
  // Get both users' right swipes
  const [userSwipes, otherUserSwipes] = await Promise.all([
    context.services.db.SongSwipe.find({
      userId,
      direction: 'right'
    }).select('songId').lean(),
    context.services.db.SongSwipe.find({
      userId: otherUserId,
      direction: 'right'
    }).select('songId').lean()
  ]);

  // Find matching song IDs
  const userSongIds = new Set(userSwipes.map(swipe => swipe.songId.toString()));
  const matchingSongIds = otherUserSwipes
    .map(swipe => swipe.songId.toString())
    .filter(id => userSongIds.has(id));

  // Get full song details for matches
  const matches = await context.services.db.Song.find({
    _id: { $in: matchingSongIds }
  })
    .populate('artist')
    .populate('album')
    .lean();

  return matches;
});

/**
 * Get user's swipe compatibility with another user
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @param {string} otherUserId Other user ID
 * @returns {Promise<Object>} Compatibility metrics
 */
export const getUserSwipeCompatibility = withErrorHandling(async (context, userId, otherUserId) => {
  const [userStats, otherUserStats] = await Promise.all([
    getSwipeStats(context, userId),
    getSwipeStats(context, otherUserId)
  ]);

  // Get matching songs
  const matches = await getUserSwipeMatches(context, userId, otherUserId);

  // Calculate compatibility metrics
  const totalSongs = new Set([
    ...userStats.uniqueSongs,
    ...otherUserStats.uniqueSongs
  ]).size;

  const compatibility = {
    matchCount: matches.length,
    matchPercentage: totalSongs > 0 ? (matches.length / totalSongs) * 100 : 0,
    userStats: {
      totalSwipes: userStats.total,
      rightSwipes: userStats.right,
      leftSwipes: userStats.left
    },
    otherUserStats: {
      totalSwipes: otherUserStats.total,
      rightSwipes: otherUserStats.right,
      leftSwipes: otherUserStats.left
    },
    matchingSongs: matches
  };

  return compatibility;
});

/**
 * Get user's swipe preferences
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @returns {Promise<Object>} User preferences
 */
export const getUserSwipePreferences = withErrorHandling(async (context, userId) => {
  // Get user's right swipes
  const rightSwipes = await context.services.db.SongSwipe.find({
    userId,
    direction: 'right'
  })
    .populate({
      path: 'songId',
      select: 'genre artist album'
    })
    .lean();

  // Analyze preferences
  const preferences = {
    genres: {},
    artists: {},
    albums: {},
    totalLikes: rightSwipes.length
  };

  rightSwipes.forEach(swipe => {
    const song = swipe.songId;
    
    // Genre preferences
    if (song.genre) {
      preferences.genres[song.genre] = (preferences.genres[song.genre] || 0) + 1;
    }

    // Artist preferences
    if (song.artist) {
      const artistId = song.artist._id.toString();
      preferences.artists[artistId] = (preferences.artists[artistId] || 0) + 1;
    }

    // Album preferences
    if (song.album) {
      const albumId = song.album._id.toString();
      preferences.albums[albumId] = (preferences.albums[albumId] || 0) + 1;
    }
  });

  // Convert to sorted arrays
  preferences.topGenres = Object.entries(preferences.genres)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));

  preferences.topArtists = Object.entries(preferences.artists)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([artistId, count]) => ({ artistId, count }));

  preferences.topAlbums = Object.entries(preferences.albums)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([albumId, count]) => ({ albumId, count }));

  return preferences;
});

/**
 * Get users with similar swipe preferences
 * @param {Object} context Service context
 * @param {string} userId User ID
 * @param {Object} options Query options
 * @returns {Promise<Object[]>} Similar users
 */
export const getSimilarUsers = withErrorHandling(async (context, userId, options = {}) => {
  const { limit = 10 } = options;

  // Get user's preferences
  const userPreferences = await getUserSwipePreferences(context, userId);

  // Get all users' swipe preferences
  const allUsers = await context.services.db.SongSwipe.distinct('userId', {
    userId: { $ne: userId }
  });

  // Calculate similarity scores
  const userScores = await Promise.all(
    allUsers.map(async otherUserId => {
      const otherPreferences = await getUserSwipePreferences(context, otherUserId);
      const compatibility = await getUserSwipeCompatibility(context, userId, otherUserId);

      // Calculate genre similarity
      const genreSimilarity = userPreferences.topGenres.reduce((score, { genre }) => {
        return score + (otherPreferences.genres[genre] || 0);
      }, 0);

      // Calculate overall similarity score
      const similarityScore = (
        (genreSimilarity * 0.4) +
        (compatibility.matchPercentage * 0.6)
      );

      return {
        userId: otherUserId,
        similarityScore,
        matchCount: compatibility.matchCount,
        matchPercentage: compatibility.matchPercentage,
        genreSimilarity
      };
    })
  );

  // Sort by similarity score and return top matches
  return userScores
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}); 