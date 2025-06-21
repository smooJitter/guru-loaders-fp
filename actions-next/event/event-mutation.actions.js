// Define configuration and library-specific logic at the top
const ERRORS = {
  EVENT_NOT_FOUND: (id) => `Event not found: ${id}`,
  INVALID_INPUT: 'Invalid input',
};

const sanitizeEvent = (event) => {
  // Logic to sanitize event (customize as needed)
  return event;
};

import { withNamespace } from '../../src/utils/with-namespace.js';

const createEvent = async ({ context, ...data }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await new Event(data).save();
  return sanitizeEvent(event.toObject());
};

const updateEvent = async ({ context, eventId, data }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const deleteEvent = async ({ context, eventId }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: { deletedAt: new Date(), status: 'DELETED' } },
    { new: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const restoreEvent = async ({ context, eventId }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: { deletedAt: null, status: 'ACTIVE' } },
    { new: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const publishEvent = async ({ context, eventId }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: { status: 'PUBLISHED', publishedAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const updateStatusEvent = async ({ context, eventId, status }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: { status } },
    { new: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const reserveCapacityEvent = async ({ context, eventId, count = 1 }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $inc: { attendeeCount: count } },
    { new: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const releaseCapacityEvent = async ({ context, eventId, count = 1 }) => {
  const { models } = context;
  const Event = models.Event;
  const event = await Event.findByIdAndUpdate(
    eventId,
    { $inc: { attendeeCount: -count } },
    { new: true }
  ).lean().exec();
  if (!event) throw new Error(ERRORS.EVENT_NOT_FOUND(eventId));
  return sanitizeEvent(event);
};

const bulkUpdateEvents = async ({ context, eventIds, data }) => {
  const { models } = context;
  const Event = models.Event;
  const result = await Event.updateMany(
    { _id: { $in: eventIds } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

const bulkDeleteEvents = async ({ context, eventIds }) => {
  const { models } = context;
  const Event = models.Event;
  const result = await Event.updateMany(
    { _id: { $in: eventIds } },
    { $set: { deletedAt: new Date(), status: 'DELETED' } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('event', {
  createEvent,
  updateEvent,
  deleteEvent,
  restoreEvent,
  publishEvent,
  updateStatusEvent,
  reserveCapacityEvent,
  releaseCapacityEvent,
  bulkUpdateEvents,
  bulkDeleteEvents
});
