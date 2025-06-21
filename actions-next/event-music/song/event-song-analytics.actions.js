// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import * as R from 'ramda';
import { isArray } from 'ramda-adjunct';
import { withNamespace } from '../../../src/utils/with-namespace.js';
import {
  buildAggregationPipeline,
  buildGroupStage,
  buildSortStage,
  bucketByDay,
  safeAggregate
} from '../../utils/analytics/shared-utils.js';
import { parseISO } from 'date-fns';

// Pure helper for groupBy selection
const getGroupByForPeriod = (period) => {
  switch (period) {
    case 'week': return { $dateToString: { format: '%Y-%U', date: '$lastPlayedAt' } };
    case 'month': return { $dateToString: { format: '%Y-%m', date: '$lastPlayedAt' } };
    case 'day':
    default: return { $dateToString: { format: '%Y-%m-%d', date: '$lastPlayedAt' } };
  }
};

const getSongPlayTrends = async ({ context, id, period = 'day', start, end }) => {
  const { Song } = context.models;
  const groupBy = getGroupByForPeriod(period);
  const match = { _id: id };
  if (start || end) {
    match.lastPlayedAt = {};
    if (start) match.lastPlayedAt.$gte = typeof start === 'string' ? parseISO(start) : start;
    if (end) match.lastPlayedAt.$lte = typeof end === 'string' ? parseISO(end) : end;
  }
  const pipeline = buildAggregationPipeline({
    match,
    extraStages: [
      { $unwind: '$ratings' }, // # Reason: Unwind ratings to group by playCount per rating event
      buildGroupStage(groupBy, { playCount: { $sum: '$playCount' } }),
      buildSortStage({ _id: 1 })
    ]
  });
  return safeAggregate(await Song.aggregate(pipeline));
};

const getTopRatedSongsAnalytics = async ({ context, limit = 10 }) => {
  const { Song } = context.models;
  const pipeline = [
    { $addFields: { avgRating: { $avg: '$ratings.value' } } },
    buildSortStage({ avgRating: -1 }),
    { $limit: limit }
  ];
  return safeAggregate(await Song.aggregate(pipeline))
    .map(({ _id, title, artist, avgRating }) => ({ _id, title, artist, avgRating }));
};

// Centralized rating distribution utility using Ramda
const getRatingDistribution = (ratings) => {
  const arr = isArray(ratings) ? ratings : [];
  return R.map(
    value => ({
      value,
      count: R.pipe(
        R.filter(r => r && r.value === value),
        R.length
      )(arr)
    }),
    R.range(1, 6)
  );
};

const getSongRatingDistribution = async ({ context, id }) => {
  const { Song } = context.models;
  const song = await Song.findById(id).lean().exec();
  return getRatingDistribution(song?.ratings);
};

// Play heatmap: 7x24 matrix using Ramda
const getSongPlayHeatmap = async ({ context, id }) => {
  const { Song } = context.models;
  const pipeline = [
    { $match: { _id: id } },
    { $unwind: '$ratings' },
    { $project: {
        weekday: { $isoDayOfWeek: '$lastPlayedAt' },
        hour: { $hour: '$lastPlayedAt' }
      }
    },
    { $group: { _id: { weekday: '$weekday', hour: '$hour' }, count: { $sum: 1 } } }
  ];
  const raw = safeAggregate(await Song.aggregate(pipeline));
  // Build 7x24 matrix (Monday=1, Sunday=7)
  return R.map(
    d => R.map(
      h => {
        const found = R.find(r => r._id.weekday === d + 1 && r._id.hour === h, raw);
        return found ? found.count : 0;
      },
      R.range(0, 24)
    ),
    R.range(0, 7)
  );
};

const getSongChurnAnalytics = async ({ context, id }) => {
  const { Song } = context.models;
  const pipeline = [
    { $match: { _id: id } },
    { $unwind: '$ratings' },
    { $group: { _id: '$ratings.userId', playCount: { $sum: 1 }, lastPlayed: { $max: '$lastPlayedAt' } } },
    { $sort: { playCount: -1 } }
  ];
  const churn = await Song.aggregate(pipeline);
  return safeAggregate(churn);
};

const getSongSegmentationAnalytics = async ({ context, id }) => {
  const { Song } = context.models;
  // Segmentation: breakdown by rating and play count buckets
  const pipeline = [
    { $match: { _id: id } },
    { $unwind: '$ratings' },
    { $group: { _id: '$ratings.value', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];
  const byRating = await Song.aggregate(pipeline);
  // Play count buckets (e.g., 0-10, 11-50, 51+)
  const playCountPipeline = [
    { $match: { _id: id } },
    { $bucket: {
        groupBy: '$playCount',
        boundaries: [0, 10, 50, 100, 1000],
        default: '1000+',
        output: { count: { $sum: 1 } }
      }
    }
  ];
  const byPlayCount = await Song.aggregate(playCountPipeline);
  return { byRating: safeAggregate(byRating), byPlayCount: safeAggregate(byPlayCount) };
};

export default withNamespace('eventSong', {
  getSongPlayTrends,
  getTopRatedSongsAnalytics,
  getSongRatingDistribution,
  getSongPlayHeatmap,
  getSongChurnAnalytics,
  getSongSegmentationAnalytics
});

export {
  getGroupByForPeriod,
  getRatingDistribution,
  safeAggregate
};
