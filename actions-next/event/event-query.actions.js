// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeEvent = (event) => {
  // Logic to sanitize event (customize as needed)
  return event;
};

import { withNamespace } from '../../src/utils/with-namespace.js';
import { withPagination } from './lib/with-pagination.js';

const getEvent = async ({ context, eventId }) => {
  const { models } = context;
  const Event = models.Event;
  if (!eventId) throw new Error(ERRORS.INVALID_INPUT);
  const event = await Event.findById(eventId).lean().exec();
  return event ? sanitizeEvent(event) : null;
};

const listEvents = async ({ context, limit = 10, offset = 0, filters = {}, sortBy = 'createdAt', sortOrder = -1 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find(filters)
      .sort({ [sortBy]: sortOrder })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments(filters),
    offset,
    sanitize: sanitizeEvent
  });
};

const searchEvents = async ({ context, query, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { location: { $regex: query, $options: 'i' } }
    ]
  };
  return withPagination({
    queryFn: () => Event.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments(searchQuery),
    offset,
    sanitize: sanitizeEvent
  });
};

const getEventsByStatus = async ({ context, status, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ status })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ status }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getUpcomingEvents = async ({ context, now = new Date(), limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ startDate: { $gte: now } })
      .sort({ startDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ startDate: { $gte: now } }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getPastEvents = async ({ context, now = new Date(), limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ endDate: { $lt: now } })
      .sort({ endDate: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ endDate: { $lt: now } }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getEventsByOrganizer = async ({ context, organizerId, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ organizerId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ organizerId }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getEventsByTag = async ({ context, tag, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ tags: tag })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ tags: tag }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getEventsInDateRange = async ({ context, start, end, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({
      startDate: { $gte: new Date(start) },
      endDate: { $lte: new Date(end) }
    })
      .sort({ startDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({
      startDate: { $gte: new Date(start) },
      endDate: { $lte: new Date(end) }
    }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getEventsWithAvailableCapacity = async ({ context, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ $expr: { $lt: ['$attendeeCount', '$capacity'] } })
      .sort({ startDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ $expr: { $lt: ['$attendeeCount', '$capacity'] } }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getFeaturedEvents = async ({ context, limit = 10, offset = 0 }) => {
  const { models } = context;
  const Event = models.Event;
  return withPagination({
    queryFn: () => Event.find({ featured: true })
      .sort({ startDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    countFn: () => Event.countDocuments({ featured: true }),
    offset,
    sanitize: sanitizeEvent
  });
};

const getEventStatistics = async ({ context }) => {
  const { models } = context;
  const Event = models.Event;
  const pipeline = [
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  const result = await Event.aggregate(pipeline);
  return Array.isArray(result) ? result : [];
};

export default withNamespace('event', {
  getEvent,
  listEvents,
  searchEvents,
  getEventsByStatus,
  getUpcomingEvents,
  getPastEvents,
  getEventsByOrganizer,
  getEventsByTag,
  getEventsInDateRange,
  getEventsWithAvailableCapacity,
  getFeaturedEvents,
  getEventStatistics
});
