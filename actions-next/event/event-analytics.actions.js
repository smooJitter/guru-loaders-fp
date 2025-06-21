// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

import { withNamespace } from '../../src/utils/with-namespace.js';
import {
  buildAggregationPipeline,
  buildGroupStage,
  buildSortStage,
  safeAggregate,
  bucketByDay
} from '../utils/analytics/shared-utils.js';

const getEventCountByStatus = async ({ context }) => {
  const { models } = context;
  const Event = models.Event;
  const pipeline = buildAggregationPipeline({
    groupBy: '$status',
    aggregations: { count: { $sum: 1 } },
    sort: { count: -1 }
  });
  return safeAggregate(await Event.aggregate(pipeline));
};

const getEventCapacityUtilization = async ({ context }) => {
  const { models } = context;
  const Event = models.Event;
  const pipeline = [
    {
      $project: {
        name: 1,
        capacity: 1,
        attendeeCount: 1,
        utilization: {
          $cond: [
            { $gt: ['$capacity', 0] },
            { $divide: ['$attendeeCount', '$capacity'] },
            0
          ]
        }
      }
    }
  ];
  return safeAggregate(await Event.aggregate(pipeline));
};

const getEventCreationTrend = async ({ context, startDate, endDate }) => {
  const { models } = context;
  const Event = models.Event;
  const match = {};
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = buildAggregationPipeline({
    match,
    groupBy: { day: bucketByDay('createdAt') },
    aggregations: { count: { $sum: 1 } },
    sort: { 'day': 1 }
  });
  return safeAggregate(await Event.aggregate(pipeline));
};

const getMostPopularEvents = async ({ context, limit = 10 }) => {
  const { models } = context;
  const Event = models.Event;
  return Event.find()
    .sort({ attendeeCount: -1 })
    .limit(limit)
    .lean()
    .exec();
};

const getEventTypeBreakdown = async ({ context }) => {
  const { models } = context;
  const Event = models.Event;
  const pipeline = [
    { $unwind: '$tags' },
    buildGroupStage('$tags', { count: { $sum: 1 } }),
    buildSortStage({ count: -1 })
  ];
  return safeAggregate(await Event.aggregate(pipeline));
};

const getEventActivityTimeline = async ({ context, eventId }) => {
  // Would require an activity log or event history
  return [];
};

export default withNamespace('event', {
  getEventCountByStatus,
  getEventCapacityUtilization,
  getEventCreationTrend,
  getMostPopularEvents,
  getEventTypeBreakdown,
  getEventActivityTimeline
});
