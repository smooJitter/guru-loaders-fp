import R from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { getUserPreferencesFromSwipes } from '../lib/songSwipePreferences.js';
import { buildPaginationMeta } from '../lib/pagination.js';

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

/**
 * Get swipe history for a user, paginated.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @param {number} [params.page=1] - Page number.
 * @param {number} [params.limit=20] - Page size.
 * @param {string} [params.direction] - Swipe direction.
 * @param {string} [params.startDate] - Start date.
 * @param {string} [params.endDate] - End date.
 * @returns {Promise<Object>}
 */
const getHistory = async ({ context, userId, page = 1, limit = 20, direction, startDate, endDate }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongSwipe } = context.models;
  const query = { userId };
  if (direction) query.direction = direction;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  const [swipes, total] = await Promise.all([
    SongSwipe.find(query).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).populate('songId').lean().exec(),
    SongSwipe.countDocuments(query)
  ]);
  return {
    swipes: R.defaultTo([], swipes),
    pagination: buildPaginationMeta(total, page, limit)
  };
};

/**
 * Get user preferences based on right swipes.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @returns {Promise<Object>}
 */
const getUserPreferences = async ({ context, userId }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongSwipe } = context.models;
  const rightSwipes = await SongSwipe.find({ userId, direction: 'right' }).populate({ path: 'songId', select: 'genre artist album' }).lean();
  return getUserPreferencesFromSwipes(rightSwipes);
};

/**
 * Get compatibility stats between two users.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @param {string} params.otherUserId - The other user ID.
 * @returns {Promise<Object>}
 */
const getUserCompatibility = async ({ context, userId, otherUserId }) => {
  if (!isNotNilOrEmpty(userId) || !isNotNilOrEmpty(otherUserId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongSwipe } = context.models;
  const getStats = async (userId) => {
    const stats = await SongSwipe.aggregate([
      { $match: { userId } },
      { $group: { _id: '$direction', count: { $sum: 1 }, songs: { $addToSet: '$songId' } } }
    ]);
    const result = { total: 0, left: 0, right: 0, uniqueSongs: new Set() };
    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
      stat.songs.forEach(songId => result.uniqueSongs.add(songId));
    });
    result.uniqueSongs = Array.from(result.uniqueSongs);
    return result;
  };
  const getUserMatches = async (userId, otherUserId) => {
    const [userSwipes, otherUserSwipes] = await Promise.all([
      SongSwipe.find({ userId, direction: 'right' }).select('songId').lean(),
      SongSwipe.find({ userId: otherUserId, direction: 'right' }).select('songId').lean()
    ]);
    const userSongIds = new Set(userSwipes.map(swipe => swipe.songId.toString()));
    const matchingSongIds = otherUserSwipes.map(swipe => swipe.songId.toString()).filter(id => userSongIds.has(id));
    return matchingSongIds;
  };
  const userStats = await getStats(userId);
  const otherUserStats = await getStats(otherUserId);
  const matches = await getUserMatches(userId, otherUserId);
  const totalSongs = new Set([...(userStats.uniqueSongs || []), ...(otherUserStats.uniqueSongs || [])]).size;
  const compatibility = {
    matchCount: matches.length,
    matchPercentage: totalSongs > 0 ? (matches.length / totalSongs) * 100 : 0,
    userStats: { totalSwipes: userStats.total, rightSwipes: userStats.right, leftSwipes: userStats.left },
    otherUserStats: { totalSwipes: otherUserStats.total, rightSwipes: otherUserStats.right, leftSwipes: otherUserStats.left },
    matchingSongs: matches
  };
  return compatibility;
};

/**
 * Get similar users based on preferences and compatibility.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @param {number} [params.limit=10] - Max results.
 * @returns {Promise<Array>}
 */
const getSimilarUsers = async ({ context, userId, limit = 10 }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongSwipe } = context.models;
  const userPreferences = await getUserPreferences({ context, userId });
  const allUsers = await SongSwipe.distinct('userId', { userId: { $ne: userId } });
  const getUserCompatibilityLocal = async (userId, otherUserId) => getUserCompatibility({ context, userId, otherUserId });
  const userScores = await Promise.all(
    allUsers.map(async otherUserId => {
      const otherPreferences = await getUserPreferences({ context, userId: otherUserId });
      const compatibility = await getUserCompatibilityLocal(userId, otherUserId);
      const genreSimilarity = userPreferences.topGenres.reduce((score, { genre }) => score + (otherPreferences.genres[genre] || 0), 0);
      const similarityScore = ((genreSimilarity * 0.4) + (compatibility.matchPercentage * 0.6));
      return { userId: otherUserId, similarityScore, matchCount: compatibility.matchCount, matchPercentage: compatibility.matchPercentage, genreSimilarity };
    })
  );
  return userScores.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
};

/**
 * Get matching songs liked by both users.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @param {string} params.otherUserId - The other user ID.
 * @returns {Promise<Array>}
 */
const getUserMatches = async ({ context, userId, otherUserId }) => {
  if (!isNotNilOrEmpty(userId) || !isNotNilOrEmpty(otherUserId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongSwipe, Song } = context.models;
  const [userSwipes, otherUserSwipes] = await Promise.all([
    SongSwipe.find({ userId, direction: 'right' }).select('songId').lean(),
    SongSwipe.find({ userId: otherUserId, direction: 'right' }).select('songId').lean()
  ]);
  const userSongIds = new Set(userSwipes.map(swipe => swipe.songId.toString()));
  const matchingSongIds = otherUserSwipes.map(swipe => swipe.songId.toString()).filter(id => userSongIds.has(id));
  const matches = await Song.find({ _id: { $in: matchingSongIds } }).populate('artist').populate('album').lean();
  return R.defaultTo([], matches);
};

/**
 * Get song recommendations for a user based on liked genres.
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.userId - The user ID.
 * @param {number} [params.limit=10] - Max results.
 * @returns {Promise<Array>}
 */
const getRecommendations = async ({ context, userId, limit = 10 }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { SongSwipe, Song } = context.models;
  const userSwipes = await SongSwipe.find({ userId }).select('songId direction').lean();
  const likedSongs = userSwipes.filter(swipe => swipe.direction === 'right').map(swipe => swipe.songId);
  const genreStats = await Song.aggregate([
    { $match: { _id: { $in: likedSongs } } },
    { $group: { _id: '$genre', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const topGenres = genreStats.slice(0, 3).map(stat => stat._id);
  const recommendations = await Song.aggregate([
    { $match: { _id: { $nin: userSwipes.map(swipe => swipe.songId) }, genre: { $in: topGenres } } },
    { $addFields: { genreMatch: { $cond: [{ $in: ['$genre', topGenres] }, 1, 0] } } },
    { $sort: { genreMatch: -1, playCount: -1 } },
    { $limit: limit },
    { $lookup: { from: 'artists', localField: 'artist', foreignField: '_id', as: 'artistDetails' } },
    { $project: { _id: 1, title: 1, artist: { $arrayElemAt: ['$artistDetails', 0] }, genre: 1, coverImage: 1, playCount: 1 } }
  ]);
  return R.defaultTo([], recommendations);
};

// Future-proofed: advanced queries
/**
 * Advanced query: get swipes by genre (future-proofed).
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.genre - Genre name.
 * @returns {Promise<Array>}
 */
const getSwipesByGenre = async ({ context, genre }) => {
  // TODO: Implement advanced query by genre
  return [];
};

/**
 * Advanced query: get swipes by time range (future-proofed).
 * @param {Object} params
 * @param {Object} params.context - The request context.
 * @param {string} params.start - Start date.
 * @param {string} params.end - End date.
 * @returns {Promise<Array>}
 */
const getSwipesByTimeRange = async ({ context, start, end }) => {
  // TODO: Implement advanced query by time range
  return [];
};

export default withNamespace('eventSongSwipe', {
  getHistory: {
    method: getHistory,
    meta: { audit: true, cache: { ttl: '1m' } }
  },
  getSimilarUsers: {
    method: getSimilarUsers,
    meta: { cache: { ttl: '2m' } }
  },
  getUserPreferences: {
    method: getUserPreferences,
    meta: { cache: { ttl: '2m' } }
  },
  getUserCompatibility: {
    method: getUserCompatibility,
    meta: { cache: { ttl: '2m' } }
  },
  getUserMatches: {
    method: getUserMatches,
    meta: { cache: { ttl: '2m' } }
  },
  getRecommendations: {
    method: getRecommendations,
    meta: { cache: { ttl: '2m' } }
  },
  getSwipesByGenre: {
    method: getSwipesByGenre
  },
  getSwipesByTimeRange: {
    method: getSwipesByTimeRange
  }
});
