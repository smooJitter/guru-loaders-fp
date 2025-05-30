/**
 * Shared TimeSlot Type Composers
 * @module gcm-type-composers/lib/shared/scheduling/timeSlot.typeComposer
 * @see domain-models/lib/shared_schema/scheduling/timeSlot.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create RecurrenceRule type composer
export const RecurrenceRuleTC = schemaComposer.createObjectTC({
  name: 'RecurrenceRule',
  description: 'Rule for recurring time slots',
  fields: {
    frequency: {
      type: 'enum RecurrenceFrequency { daily weekly monthly yearly }',
      description: 'Frequency of recurrence'
    },
    interval: {
      type: 'Int',
      description: 'Interval between occurrences',
      defaultValue: 1
    },
    daysOfWeek: {
      type: '[Int]',
      description: 'Days of week (0-6, 0 = Sunday)'
    },
    daysOfMonth: {
      type: '[Int]',
      description: 'Days of month (1-31)'
    },
    monthsOfYear: {
      type: '[Int]',
      description: 'Months of year (0-11)'
    },
    endDate: {
      type: 'Date',
      description: 'When recurrence ends'
    },
    occurrences: {
      type: 'Int',
      description: 'Number of occurrences'
    },
    exceptions: {
      type: '[Date]',
      description: 'Dates to exclude'
    }
  }
});

// Create Booking type composer
export const BookingTC = schemaComposer.createObjectTC({
  name: 'TimeSlotBooking',
  description: 'Booking for a time slot',
  fields: {
    userId: {
      type: 'MongoID!',
      description: 'User who booked'
    },
    quantity: {
      type: 'Int!',
      description: 'Number of spots booked',
      defaultValue: 1
    },
    status: {
      type: 'enum BookingStatus { confirmed cancelled no_show }',
      description: 'Booking status',
      defaultValue: 'confirmed'
    },
    bookedAt: {
      type: 'Date!',
      description: 'When booking was made'
    }
  }
});

// Create main TimeSlot type composer
export const TimeSlotTC = schemaComposer.createObjectTC({
  name: 'TimeSlot',
  description: 'Bookable time slot',
  fields: {
    startTime: {
      type: 'Date!',
      description: 'Start time'
    },
    endTime: {
      type: 'Date!',
      description: 'End time'
    },
    duration: {
      type: 'Int!',
      description: 'Duration in minutes'
    },
    type: {
      type: 'enum TimeSlotType { available booked blocked maintenance }',
      description: 'Slot type',
      defaultValue: 'available'
    },
    capacity: {
      type: 'Int!',
      description: 'Maximum number of bookings',
      defaultValue: 1
    },
    currentBookings: {
      type: 'Int!',
      description: 'Current number of bookings',
      defaultValue: 0
    },
    entityType: {
      type: 'String!',
      description: 'Type of entity this slot belongs to'
    },
    entityId: {
      type: 'MongoID!',
      description: 'ID of entity this slot belongs to'
    },
    recurrence: {
      type: 'RecurrenceRule',
      description: 'Recurrence pattern'
    },
    status: {
      type: 'enum TimeSlotStatus { active cancelled completed }',
      description: 'Current status',
      defaultValue: 'active'
    },
    metadata: {
      type: 'JSON',
      description: 'Additional metadata'
    },
    bookings: {
      type: '[TimeSlotBooking!]',
      description: 'List of bookings'
    },
    isAvailable: {
      type: 'Boolean!',
      description: 'Whether slot can be booked',
      resolve: source => 
        source.status === 'active' && 
        source.type === 'available' &&
        source.currentBookings < source.capacity
    },
    availableSpots: {
      type: 'Int!',
      description: 'Number of spots available',
      resolve: source => Math.max(0, source.capacity - source.currentBookings)
    }
  }
});

// Add input validation
TimeSlotTC.getInputTypeComposer().addValidator(value => {
  if (value.startTime && value.endTime) {
    const start = new Date(value.startTime);
    const end = new Date(value.endTime);
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
  }
  
  if (value.duration && value.duration < 1) {
    throw new Error('Duration must be positive');
  }
  
  if (value.capacity && value.capacity < 0) {
    throw new Error('Capacity cannot be negative');
  }
  
  if (value.recurrence) {
    if (value.recurrence.interval && value.recurrence.interval < 1) {
      throw new Error('Recurrence interval must be positive');
    }
    
    if (value.recurrence.daysOfWeek) {
      value.recurrence.daysOfWeek.forEach(day => {
        if (day < 0 || day > 6) {
          throw new Error('Days of week must be 0-6');
        }
      });
    }
    
    if (value.recurrence.daysOfMonth) {
      value.recurrence.daysOfMonth.forEach(day => {
        if (day < 1 || day > 31) {
          throw new Error('Days of month must be 1-31');
        }
      });
    }
    
    if (value.recurrence.monthsOfYear) {
      value.recurrence.monthsOfYear.forEach(month => {
        if (month < 0 || month > 11) {
          throw new Error('Months must be 0-11');
        }
      });
    }
  }
}); 