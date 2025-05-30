/**
 * Attendee Model
 * Represents an attendee's relationship with an event
 * @module domain-models/events/attendee.model
 */

import mongoose from 'mongoose';
import cleanToJSON from '../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../lib/plugins/timestamps.js';
import { statusTrackableFlexPlugin } from '../lib/plugins/status-trackable-flex.js';
import { metadataSchema } from '../lib/shared_schema/metadata.schema.js';

const { Schema, model } = mongoose;

/**
 * @typedef {Object} CheckInRecord
 * @property {Date} time - When the check-in occurred
 * @property {string} method - Method used for check-in
 * @property {string} location - Location of check-in
 * @property {mongoose.Schema.Types.ObjectId} processedBy - Staff who processed check-in
 */
const CheckInSchema = new Schema({
  time: {
    type: Date,
    required: true
  },
  method: {
    type: String,
    enum: ['qr', 'manual', 'auto'],
    default: 'qr'
  },
  location: String,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

/**
 * @typedef {Object} CheckOutRecord
 * @property {Date} time - When the check-out occurred
 * @property {string} method - Method used for check-out
 * @property {string} location - Location of check-out
 * @property {mongoose.Schema.Types.ObjectId} processedBy - Staff who processed check-out
 */
const CheckOutSchema = new Schema({
  time: {
    type: Date,
    required: true
  },
  method: {
    type: String,
    enum: ['qr', 'manual', 'auto'],
    default: 'qr'
  },
  location: String,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

/**
 * @typedef {Object} Attendee
 * @property {mongoose.Schema.Types.ObjectId} eventId - Associated event
 * @property {mongoose.Schema.Types.ObjectId} userId - User who is attending
 * @property {mongoose.Schema.Types.ObjectId} ticketId - Associated ticket
 * @property {string} status - Current attendance status
 * @property {Array<CheckInRecord>} checkIns - Check-in history
 * @property {Array<CheckOutRecord>} checkOuts - Check-out history
 * @property {Object} preferences - Attendee preferences
 * @property {Object} metadata - Additional metadata
 */
const AttendeeSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ticketId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['registered', 'checked_in', 'checked_out', 'no_show'],
    default: 'registered',
    required: true,
    index: true
  },
  checkIns: {
    type: [CheckInSchema],
    default: []
  },
  checkOuts: {
    type: [CheckOutSchema],
    default: []
  },
  preferences: {
    songRequests: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    type: metadataSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Add plugins
AttendeeSchema.plugin(cleanToJSON);
AttendeeSchema.plugin(timestampsPlugin);
AttendeeSchema.plugin(statusTrackableFlexPlugin, {
  statuses: ['registered', 'checked_in', 'checked_out', 'no_show']
});

// Add indexes
AttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });
AttendeeSchema.index({ eventId: 1, status: 1 });
AttendeeSchema.index({ userId: 1, status: 1 });
AttendeeSchema.index({ ticketId: 1 }, { unique: true });

// Add virtuals
AttendeeSchema.virtual('isCheckedIn').get(function() {
  return this.status === 'checked_in';
});

AttendeeSchema.virtual('lastCheckIn').get(function() {
  return this.checkIns.length > 0 ? 
    this.checkIns[this.checkIns.length - 1] : null;
});

AttendeeSchema.virtual('lastCheckOut').get(function() {
  return this.checkOuts.length > 0 ? 
    this.checkOuts[this.checkOuts.length - 1] : null;
});

// Add methods
AttendeeSchema.methods.checkIn = function(method = 'qr', location = null, processedBy = null) {
  if (this.status === 'checked_in') {
    throw new Error('Attendee is already checked in');
  }

  const checkIn = {
    time: new Date(),
    method,
    location,
    processedBy
  };

  this.checkIns.push(checkIn);
  this.status = 'checked_in';

  return checkIn;
};

AttendeeSchema.methods.checkOut = function(method = 'qr', location = null, processedBy = null) {
  if (this.status !== 'checked_in') {
    throw new Error('Attendee is not checked in');
  }

  const checkOut = {
    time: new Date(),
    method,
    location,
    processedBy
  };

  this.checkOuts.push(checkOut);
  this.status = 'checked_out';

  return checkOut;
};

AttendeeSchema.methods.markNoShow = function() {
  if (this.status === 'checked_in' || this.status === 'checked_out') {
    throw new Error('Cannot mark as no-show after check-in');
  }

  this.status = 'no_show';
};

AttendeeSchema.methods.updatePreferences = function(preferences) {
  Object.assign(this.preferences, preferences);
};

// Create model
const Attendee = model('Attendee', AttendeeSchema);

export default Attendee; 