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

// Pure function: transforms aggregation stats to result object
const STATUSES = ['pending', 'approved', 'rejected', 'played'];
const toRequestStats = (input) => {
  const arr = Array.isArray(input) ? input : [];
  return arr.reduce((acc, stat) => {
    if (STATUSES.includes(stat._id)) {
      acc[stat._id] = (acc[stat._id] || 0) + (stat.count ?? 0);
    }
    acc.total += stat.count ?? 0;
    acc.totalCreditsSpent += stat.creditsSpent ?? 0;
    return acc;
  }, { total: 0, pending: 0, approved: 0, rejected: 0, played: 0, totalCreditsSpent: 0 });
};

// Side effect: DB read
const getRequestStats = async ({ context, userId }) => {
  const { SongRequest } = context.models;
  const stats = await SongRequest.aggregate([
    { $match: { userId } },
    { $group: { _id: '$status', count: { $sum: 1 }, creditsSpent: { $sum: '$creditsSpent' } } }
  ]);
  return toRequestStats(safeAggregate(stats));
};

// Trends: requests per day (or period)
const getRequestTrends = async ({ context, userId, period = 'day', start, end }) => {
  const { SongRequest } = context.models;
  const groupBy = bucketByDay('requestedAt'); // Can extend for week/month if needed
  const match = { userId };
  if (start || end) {
    match.requestedAt = {};
    if (start) match.requestedAt.$gte = typeof start === 'string' ? parseISO(start) : start;
    if (end) match.requestedAt.$lte = typeof end === 'string' ? parseISO(end) : end;
  }
  const pipeline = buildAggregationPipeline({
    match,
    groupBy: { day: groupBy },
    aggregations: { count: { $sum: 1 }, creditsSpent: { $sum: '$creditsSpent' } },
    sort: { 'day': 1 }
  });
  const trends = await SongRequest.aggregate(pipeline);
  return safeAggregate(trends);
};

// Breakdown: requests by status and credits
const getRequestBreakdown = async ({ context, userId }) => {
  const { SongRequest } = context.models;
  const pipeline = [
    buildMatchStage({ userId }),
    buildGroupStage('$status', { count: { $sum: 1 }, creditsSpent: { $sum: '$creditsSpent' } }),
    buildSortStage({ count: -1 })
  ];
  const breakdown = await SongRequest.aggregate(pipeline);
  return safeAggregate(breakdown);
};

export default withNamespace('eventSongRequest', {
  getRequestStats,
  getRequestTrends,
  getRequestBreakdown
});

export { toRequestStats };
