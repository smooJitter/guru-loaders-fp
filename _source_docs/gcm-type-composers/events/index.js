/**
 * Events Domain Type Composers
 * @module gcm-type-composers/events
 */

import { EventTC } from './event.modelTC.js';
import { AttendeeTC } from './attendee.modelTC.js';
import { 
  TicketPricingTC,
  TicketPurchaseTC,
  TicketUsageTC,
  TicketTC 
} from './ticket.modelTC.js';
import { defineRelations } from './defineRelations.js';

// Initialize relationships
defineRelations();

// Export type composers
export {
  EventTC,
  AttendeeTC,
  TicketPricingTC,
  TicketPurchaseTC,
  TicketUsageTC,
  TicketTC
}; 