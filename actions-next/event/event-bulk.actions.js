import { withNamespace } from '../../src/utils/with-namespace.js';

const bulkUpdateEvents = async ({ context, eventIds, data }) => {
  const { Event } = context.models;
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
  const { Event } = context.models;
  const result = await Event.updateMany(
    { _id: { $in: eventIds } },
    { $set: { deletedAt: new Date(), status: 'DELETED' } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

const bulkRestoreEvents = async ({ context, eventIds }) => {
  const { Event } = context.models;
  const result = await Event.updateMany(
    { _id: { $in: eventIds } },
    { $set: { deletedAt: null, status: 'ACTIVE' } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('event', {
  bulkUpdateEvents,
  bulkDeleteEvents,
  bulkRestoreEvents
});
