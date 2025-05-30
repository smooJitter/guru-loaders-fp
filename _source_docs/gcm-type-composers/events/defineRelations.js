/**
 * Define relationships between Event and Attendee models
 * @module gcm-type-composers/events/defineRelations
 */

import { EventTC } from './event.modelTC.js';
import { AttendeeTC } from './attendee.modelTC.js';
import { 
  TicketTC,
  TicketPricingTC,
  TicketPurchaseTC,
  TicketUsageTC 
} from './ticket.modelTC.js';
import { UserTC } from '../user/user.modelTC.js';
import { CreditTransactionTC } from '../credits/credit-transaction.modelTC.js';
import { SongRequestTC } from '../music/song-request.modelTC.js';

export function defineRelations() {
  // Event -> Tickets (One-to-Many)
  EventTC.addRelation('tickets', {
    resolver: () => TicketTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ eventId: source._id })
    },
    projection: { _id: 1 }
  });

  // Event -> Active Tickets (One-to-Many)
  EventTC.addRelation('activeTickets', {
    resolver: () => TicketTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ 
        eventId: source._id,
        status: { $in: ['pending', 'purchased'] }
      })
    },
    projection: { _id: 1 }
  });

  // Event -> Ticket Types (One-to-Many)
  EventTC.addRelation('ticketTypes', {
    resolver: () => TicketPricingTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ eventId: source._id })
    },
    projection: { _id: 1 }
  });

  // Ticket -> Event (Many-to-One)
  TicketTC.addRelation('event', {
    resolver: () => EventTC.mongooseResolvers.findById(),
    prepareArgs: {
      _id: source => source.eventId
    },
    projection: { eventId: 1 }
  });

  // Ticket -> User (Many-to-One)
  TicketTC.addRelation('user', {
    resolver: () => UserTC.mongooseResolvers.findById(),
    prepareArgs: {
      _id: source => source.userId
    },
    projection: { userId: 1 }
  });

  // Ticket -> Credit Transaction (One-to-One)
  TicketTC.addRelation('transaction', {
    resolver: () => CreditTransactionTC.mongooseResolvers.findOne(),
    prepareArgs: {
      filter: source => ({
        entityType: 'ticket',
        entityId: source._id
      })
    },
    projection: { _id: 1 }
  });

  // Event -> Attendees (One-to-Many)
  EventTC.addRelation('attendees', {
    resolver: () => AttendeeTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ eventId: source._id })
    },
    projection: { _id: 1 }
  });

  // Event -> Current Attendees (One-to-Many)
  EventTC.addRelation('currentAttendees', {
    resolver: () => AttendeeTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ 
        eventId: source._id,
        status: 'checked_in'
      })
    },
    projection: { _id: 1 }
  });

  // Event -> Song Requests (One-to-Many)
  EventTC.addRelation('songRequests', {
    resolver: () => SongRequestTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ eventId: source._id })
    },
    projection: { _id: 1 }
  });

  // Attendee -> Event (Many-to-One)
  AttendeeTC.addRelation('event', {
    resolver: () => EventTC.mongooseResolvers.findById(),
    prepareArgs: {
      _id: source => source.eventId
    },
    projection: { eventId: 1 }
  });

  // Attendee -> User (Many-to-One)
  AttendeeTC.addRelation('user', {
    resolver: () => UserTC.mongooseResolvers.findById(),
    prepareArgs: {
      _id: source => source.userId
    },
    projection: { userId: 1 }
  });

  // Attendee -> Ticket (One-to-One)
  AttendeeTC.addRelation('ticket', {
    resolver: () => TicketTC.mongooseResolvers.findById(),
    prepareArgs: {
      _id: source => source.ticketId
    },
    projection: { ticketId: 1 }
  });

  // Attendee -> Song Requests (One-to-Many)
  AttendeeTC.addRelation('songRequests', {
    resolver: () => SongRequestTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ 
        eventId: source.eventId,
        userId: source.userId
      })
    },
    projection: { eventId: 1, userId: 1 }
  });

  // Add reverse relations
  
  // User -> Tickets (One-to-Many)
  UserTC.addRelation('tickets', {
    resolver: () => TicketTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ userId: source._id })
    },
    projection: { _id: 1 }
  });

  // User -> Active Tickets (One-to-Many)
  UserTC.addRelation('activeTickets', {
    resolver: () => TicketTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({ 
        userId: source._id,
        status: { $in: ['pending', 'purchased'] }
      })
    },
    projection: { _id: 1 }
  });

  // User -> Attended Events (Many-to-Many through Attendee)
  UserTC.addRelation('attendedEvents', {
    resolver: () => EventTC.mongooseResolvers.findMany(),
    prepareArgs: {
      filter: source => ({
        _id: {
          $in: source.attendeeIds || []
        }
      })
    },
    projection: { attendeeIds: 1 }
  });

  // User -> Current Event (One-to-One, where user is checked in)
  UserTC.addRelation('currentEvent', {
    resolver: () => EventTC.mongooseResolvers.findOne(),
    prepareArgs: {
      filter: source => ({
        'attendees.userId': source._id,
        'attendees.status': 'checked_in'
      })
    },
    projection: { _id: 1 }
  });
} 