import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';
import { statusTrackableFlexPlugin } from './lib/plugins/status-trackable-flex.js';
import { taggableFlexPlugin } from './lib/plugins/taggable-flex.js';
import { timetrackablePlugin } from './lib/plugins/timetrackable.js';
import { metadataSchema } from '../lib/shared_schema/metadata.schema.js';
import { TicketPricingSchema, TicketSchema } from './schemas/ticketing.schema.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const LocationSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    postalCode: String,
    coordinates: { latitude: Number, longitude: Number }
  }, { _id: false });

  const CapacitySchema = new Schema({
    total: { type: Number, required: true, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    confirmed: { type: Number, default: 0, min: 0 }
  }, { _id: false });

  const eventSchema = new Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'Attendee' }],
    metadata: { type: Object }
  });

  eventSchema.plugin(cleanToJSON);
  eventSchema.plugin(timestampsPlugin);
  eventSchema.plugin(statusTrackableFlexPlugin, {
    statuses: ['draft', 'published', 'cancelled', 'completed']
  });
  eventSchema.plugin(taggableFlexPlugin);
  eventSchema.plugin(timetrackablePlugin);
  additionalPlugins.forEach(plugin => eventSchema.plugin(plugin));

  eventSchema.index({ startDate: 1, endDate: 1 });
  eventSchema.index({ 'location.city': 1, 'location.country': 1 });
  eventSchema.index({ 'tickets.userId': 1 });
  eventSchema.index({ 'tickets.status': 1 });

  eventSchema.virtual('isStarted').get(function() {
    return Date.now() >= this.startDate;
  });
  eventSchema.virtual('isEnded').get(function() {
    return Date.now() >= this.endDate;
  });
  eventSchema.virtual('availableCapacity').get(function() {
    return this.capacity.total - this.capacity.reserved;
  });

  eventSchema.methods.canIssueTickets = function() {
    return this.status === 'published' && !this.isEnded && this.availableCapacity > 0;
  };
  eventSchema.methods.hasTicketType = function(type) {
    return this.ticketTypes.some(t => t.type === type);
  };
  eventSchema.methods.getTicketPrice = function(type) {
    const ticketType = this.ticketTypes.find(t => t.type === type);
    return ticketType ? ticketType.creditCost : null;
  };
  eventSchema.methods.getUserTickets = function(userId) {
    return this.tickets.filter(ticket => ticket.userId.equals(userId));
  };
  eventSchema.methods.reserveTicket = function(userId, type) {
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
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
    this.tickets.push(ticket);
    this.capacity.reserved += 1;
    return ticket;
  };
  eventSchema.methods.confirmTicket = function(ticketId, transactionId, creditAmount) {
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
  eventSchema.methods.useTicket = function(ticketId, method = 'qr', location = null) {
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

  if (mongooseConnection.models.Event) {
    return mongooseConnection.models.Event;
  }
  return mongooseConnection.model('Event', eventSchema);
}; 