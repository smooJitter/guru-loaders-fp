/**
 * Event Model
 * Represents an event with ticketing and credit integration
 * @module domain-models/events/event.model
 */

import mongoose from 'mongoose';
import cleanToJSON from '../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../lib/plugins/timestamps.js';
import { statusTrackableFlexPlugin } from '../lib/plugins/status-trackable-flex.js';
import { taggableFlexPlugin } from '../lib/plugins/taggable-flex.js';
import { timetrackablePlugin } from '../lib/plugins/timetrackable.js';
import { metadataSchema } from '../lib/shared_schema/metadata.schema.js';
import { 
  TicketPricingSchema,
  TicketSchema 
} from '../lib/shared_schema/ticketing.schema.js';

const { Schema, model } = mongoose;

/**
 * @typedef {Object} EventLocation
 * @property {string} name - Name of the venue
 * @property {string} address - Full address
 * @property {string} city - City name
 * @property {string} state - State/province
 * @property {string} country - Country
 * @property {string} postalCode - Postal/zip code
 * @property {Object} coordinates - Geo coordinates
 * @property {number} coordinates.latitude - Latitude
 * @property {number} coordinates.longitude - Longitude
 */
const LocationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: String,
  country: {
    type: String,
    required: true
  },
  postalCode: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}, { _id: false });

/**
 * @typedef {Object} EventCapacity
 * @property {number} total - Total capacity
 * @property {number} reserved - Number of reserved spots
 * @property {number} confirmed - Number of confirmed attendees
 */
const CapacitySchema = new Schema({
  total: {
    type: Number,
    required: true,
    min: 0
  },
  reserved: {
    type: Number,
    default: 0,
    min: 0
  },
  confirmed: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

/**
 * @typedef {Object} Event
 * @property {string} title - Event title
 * @property {string} description - Event description
 * @property {Date} startDate - Event start date/time
 * @property {Date} endDate - Event end date/time
 * @property {EventLocation} location - Event location details
 * @property {EventCapacity} capacity - Event capacity details
 * @property {Array<TicketPricing>} ticketTypes - Available ticket types and pricing
 * @property {Array<Ticket>} tickets - Issued tickets
 * @property {Object} metadata - Additional event metadata
 */
const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  location: {
    type: LocationSchema,
    required: true
  },
  capacity: {
    type: CapacitySchema,
    required: true
  },
  ticketTypes: {
    type: [TicketPricingSchema],
    default: []
  },
  tickets: {
    type: [TicketSchema],
    default: []
  },
  metadata: {
    type: metadataSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Add plugins
EventSchema.plugin(cleanToJSON);
EventSchema.plugin(timestampsPlugin);
EventSchema.plugin(statusTrackableFlexPlugin, {
  statuses: ['draft', 'published', 'cancelled', 'completed']
});
EventSchema.plugin(taggableFlexPlugin);
EventSchema.plugin(timetrackablePlugin);

// Add indexes
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ 'location.city': 1, 'location.country': 1 });
EventSchema.index({ 'tickets.userId': 1 });
EventSchema.index({ 'tickets.status': 1 });

// Add virtuals
EventSchema.virtual('isStarted').get(function() {
  return Date.now() >= this.startDate;
});

EventSchema.virtual('isEnded').get(function() {
  return Date.now() >= this.endDate;
});

EventSchema.virtual('availableCapacity').get(function() {
  return this.capacity.total - this.capacity.reserved;
});

// Add methods
EventSchema.methods.canIssueTickets = function() {
  return this.status === 'published' && !this.isEnded && this.availableCapacity > 0;
};

EventSchema.methods.hasTicketType = function(type) {
  return this.ticketTypes.some(t => t.type === type);
};

EventSchema.methods.getTicketPrice = function(type) {
  const ticketType = this.ticketTypes.find(t => t.type === type);
  return ticketType ? ticketType.creditCost : null;
};

EventSchema.methods.getUserTickets = function(userId) {
  return this.tickets.filter(ticket => ticket.userId.equals(userId));
};

EventSchema.methods.reserveTicket = function(userId, type) {
  if (!this.canIssueTickets()) {
    throw new Error('Event is not accepting tickets');
  }

  if (!this.hasTicketType(type)) {
    throw new Error('Invalid ticket type');
  }

  const ticket = {
    eventId: this._id,
    userId,
    type,
    status: 'pending',
    reservedAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  };

  this.tickets.push(ticket);
  this.capacity.reserved += 1;

  return ticket;
};

EventSchema.methods.confirmTicket = function(ticketId, transactionId, creditAmount) {
  const ticket = this.tickets.id(ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (ticket.status !== 'pending') {
    throw new Error('Invalid ticket status');
  }

  ticket.status = 'purchased';
  ticket.purchase = {
    purchasedAt: new Date(),
    creditAmount,
    transactionId
  };

  this.capacity.confirmed += 1;
  this.capacity.reserved -= 1;

  return ticket;
};

EventSchema.methods.useTicket = function(ticketId, method = 'qr', location = null) {
  const ticket = this.tickets.id(ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (ticket.status !== 'purchased') {
    throw new Error('Invalid ticket status');
  }

  ticket.status = 'used';
  ticket.usage = {
    usedAt: new Date(),
    method,
    location
  };

  return ticket;
};

// Create model
const Event = model('Event', EventSchema);

export default Event; 