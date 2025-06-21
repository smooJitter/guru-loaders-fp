// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';
import {
  buildAggregationPipeline,
  buildMatchStage,
  buildGroupStage,
  buildSortStage,
  bucketByDay,
  safeAggregate
} from '../../utils/analytics/shared-utils.js';
import { parseISO } from 'date-fns';

// Pure function: transforms analytics to result object
const toSongAnalytics = (input) => {
  const arr = Array.isArray(input) ? input : [];
  const reduced = arr.reduce((acc, stat) => {
    acc[stat._id] = (acc[stat._id] || 0) + (stat.count ?? 0);
    acc.total += stat.count ?? 0;
    acc.uniqueUsers = Math.max(acc.uniqueUsers, Array.isArray(stat.uniqueUsers) ? stat.uniqueUsers.length : 0);
    return acc;
  }, { total: 0, left: 0, right: 0, uniqueUsers: 0, matchRate: 0 });
  return {
    ...reduced,
    matchRate: reduced.total > 0 ? (reduced.right / reduced.total) * 100 : 0
  };
};

// Side effect: DB read
const getSongAnalytics = async ({ context, songId }) => {
  const { SongSwipe } = context.models;
  const analytics = await SongSwipe.aggregate([
    { $match: { songId } },
    { $group: { _id: '$direction', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } }
  ]);
  return toSongAnalytics(safeAggregate(analytics));
};

// Pure function: transforms stats to result object
const toUserStats = (input) => {
  const arr = Array.isArray(input) ? input : [];
  const reduced = arr.reduce((acc, stat) => {
    acc[stat._id] = (acc[stat._id] || 0) + (stat.count ?? 0);
    acc.total += stat.count ?? 0;
    acc.uniqueSongs = R.union(acc.uniqueSongs, Array.isArray(stat.songs) ? stat.songs : []);
    return acc;
  }, { total: 0, left: 0, right: 0, uniqueSongs: [] });
  return {
    ...reduced,
    uniqueSongs: reduced.uniqueSongs.length
  };
};

const getStats = async ({ context, userId }) => {
  const { SongSwipe } = context.models;
  const stats = await SongSwipe.aggregate([
    { $match: { userId } },
    { $group: { _id: '$direction', count: { $sum: 1 }, songs: { $addToSet: '$songId' } } }
  ]);
  return toUserStats(safeAggregate(stats));
};

// Trends: swipes per day (or period)
const getSwipeTrends = async ({ context, userId, period = 'day', start, end }) => {
  const { SongSwipe } = context.models;
  const groupBy = bucketByDay('timestamp');
  const match = { userId };
  if (start || end) {
    match.timestamp = {};
    if (start) match.timestamp.$gte = typeof start === 'string' ? parseISO(start) : start;
    if (end) match.timestamp.$lte = typeof end === 'string' ? parseISO(end) : end;
  }
  const pipeline = buildAggregationPipeline({
    match,
    groupBy: { day: groupBy },
    aggregations: { count: { $sum: 1 } },
    sort: { 'day': 1 }
  });
  const trends = await SongSwipe.aggregate(pipeline);
  return safeAggregate(trends);
};

// Heatmap: 7x24 matrix of swipe counts by weekday/hour
const getSwipeHeatmap = async ({ context, userId }) => {
  const { SongSwipe } = context.models;
  // Group by weekday (0-6) and hour (0-23)
  const pipeline = [
    { $match: { userId } },
    { $project: {
        weekday: { $isoDayOfWeek: '$timestamp' }, // 1 (Monday) - 7 (Sunday)
        hour: { $hour: '$timestamp' }
      }
    },
    { $group: { _id: { weekday: '$weekday', hour: '$hour' }, count: { $sum: 1 } } }
  ];
  const raw = await SongSwipe.aggregate(pipeline);
  // Build 7x24 matrix (Monday=1, Sunday=7)
  const matrix = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => {
      const found = raw.find(r => r._id.weekday === d + 1 && r._id.hour === h);
      return found ? found.count : 0;
    })
  );
  return matrix;
};

// Segmentation: breakdown by direction and unique songs
const getUserSegmentation = async ({ context, userId }) => {
  const { SongSwipe } = context.models;
  const pipeline = [
    { $match: { userId } },
    { $group: { _id: '$direction', count: { $sum: 1 }, songs: { $addToSet: '$songId' } } }
  ];
  const stats = await SongSwipe.aggregate(pipeline);
  return R.map(stat => ({
    direction: stat._id,
    count: stat.count,
    uniqueSongs: Array.isArray(stat.songs) ? stat.songs.length : 0
  }), safeAggregate(stats));
};

export default withNamespace('eventSongSwipe', {
  getSongAnalytics,
  getStats,
  getSwipeTrends,
  getSwipeHeatmap,
  getUserSegmentation
});

export { toSongAnalytics, toUserStats };
