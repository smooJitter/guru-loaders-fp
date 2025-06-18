import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import { statusTrackableFlexPlugin } from './lib/plugins/status-trackable-flex.js';
import { metadataSchema } from './lib/shared_schema/metadata.schema.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const CheckInSchema = new Schema({
    time: { type: Date, required: true },
    method: { type: String, enum: ['qr', 'manual', 'auto'], default: 'qr' },
    location: String,
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }, { _id: false });

  const CheckOutSchema = new Schema({
    time: { type: Date, required: true },
    method: { type: String, enum: ['qr', 'manual', 'auto'], default: 'qr' },
    location: String,
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }, { _id: false });

  const attendeeSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    status: { type: String, enum: ['registered', 'checked_in', 'checked_out', 'no_show'], default: 'registered', required: true, index: true },
    checkIns: { type: [CheckInSchema], default: [] },
    checkOuts: { type: [CheckOutSchema], default: [] },
    preferences: {
      songRequests: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true }
    },
    metadata: { type: metadataSchema, default: () => ({}) }
  }, { timestamps: true });

  attendeeSchema.plugin(cleanToJSON);
  attendeeSchema.plugin(timestampsPlugin);
  attendeeSchema.plugin(statusTrackableFlexPlugin, {
    statuses: ['registered', 'checked_in', 'checked_out', 'no_show']
  });
  additionalPlugins.forEach(plugin => attendeeSchema.plugin(plugin));

  attendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });
  attendeeSchema.index({ eventId: 1, status: 1 });
  attendeeSchema.index({ userId: 1, status: 1 });
  attendeeSchema.index({ ticketId: 1 }, { unique: true });

  attendeeSchema.virtual('isCheckedIn').get(function() {
    return this.status === 'checked_in';
  });
  attendeeSchema.virtual('lastCheckIn').get(function() {
    return this.checkIns.length > 0 ? this.checkIns[this.checkIns.length - 1] : null;
  });
  attendeeSchema.virtual('lastCheckOut').get(function() {
    return this.checkOuts.length > 0 ? this.checkOuts[this.checkOuts.length - 1] : null;
  });

  attendeeSchema.methods.checkIn = function(method = 'qr', location = null, processedBy = null) {
    if (this.status === 'checked_in') {
      throw new Error('Attendee is already checked in');
    }
    const checkIn = { time: new Date(), method, location, processedBy };
    this.checkIns.push(checkIn);
    this.status = 'checked_in';
    return checkIn;
  };
  attendeeSchema.methods.checkOut = function(method = 'qr', location = null, processedBy = null) {
    if (this.status !== 'checked_in') {
      throw new Error('Attendee is not checked in');
    }
    const checkOut = { time: new Date(), method, location, processedBy };
    this.checkOuts.push(checkOut);
    this.status = 'checked_out';
    return checkOut;
  };
  attendeeSchema.methods.markNoShow = function() {
    if (this.status === 'checked_in' || this.status === 'checked_out') {
      throw new Error('Cannot mark as no-show after check-in');
    }
    this.status = 'no_show';
  };
  attendeeSchema.methods.updatePreferences = function(preferences) {
    Object.assign(this.preferences, preferences);
  };

  if (mongooseConnection.models.Attendee) {
    return mongooseConnection.models.Attendee;
  }
  return mongooseConnection.model('Attendee', attendeeSchema);
}; 