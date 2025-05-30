/**
 * Attendee Type Composer
 * @module gcm-type-composers/events/attendee.modelTC
 */

import { schemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import { Attendee } from '../../domain-models/events/index.js';

// Create the CheckIn type
const CheckInTC = schemaComposer.createObjectTC({
  name: 'CheckInRecord',
  fields: {
    time: 'Date!',
    method: {
      type: 'enum CheckInMethod { qr manual auto }',
      defaultValue: 'qr'
    },
    location: 'String',
    processedBy: 'MongoID'
  }
});

// Create the CheckOut type
const CheckOutTC = schemaComposer.createObjectTC({
  name: 'CheckOutRecord',
  fields: {
    time: 'Date!',
    method: {
      type: 'enum CheckOutMethod { qr manual auto }',
      defaultValue: 'qr'
    },
    location: 'String',
    processedBy: 'MongoID'
  }
});

// Create the Preferences type
const PreferencesTC = schemaComposer.createObjectTC({
  name: 'AttendeePreferences',
  fields: {
    songRequests: {
      type: 'Boolean!',
      defaultValue: true
    },
    notifications: {
      type: 'Boolean!',
      defaultValue: true
    }
  }
});

// Create the Attendee TypeComposer
export const AttendeeTC = composeWithMongoose(Attendee, {
  name: 'Attendee',
  description: 'An attendee record for an event',
  fields: {
    remove: ['__v'],
    override: {
      checkIns: {
        type: [CheckInTC],
        description: 'Check-in history'
      },
      checkOuts: {
        type: [CheckOutTC],
        description: 'Check-out history'
      },
      preferences: {
        type: PreferencesTC,
        description: 'Attendee preferences'
      }
    }
  }
});

// Add computed fields
AttendeeTC.addFields({
  isCheckedIn: {
    type: 'Boolean!',
    description: 'Whether the attendee is currently checked in',
    resolve: source => source.status === 'checked_in'
  },
  lastCheckIn: {
    type: CheckInTC,
    description: 'Most recent check-in record',
    resolve: source => source.checkIns.length > 0 ? 
      source.checkIns[source.checkIns.length - 1] : null
  },
  lastCheckOut: {
    type: CheckOutTC,
    description: 'Most recent check-out record',
    resolve: source => source.checkOuts.length > 0 ? 
      source.checkOuts[source.checkOuts.length - 1] : null
  },
  checkInCount: {
    type: 'Int!',
    description: 'Number of times checked in',
    resolve: source => source.checkIns.length
  },
  checkOutCount: {
    type: 'Int!',
    description: 'Number of times checked out',
    resolve: source => source.checkOuts.length
  },
  attendanceStatus: {
    type: 'String!',
    description: 'Current attendance status',
    resolve: source => {
      if (source.status === 'no_show') return 'NO_SHOW';
      if (source.status === 'checked_in') return 'PRESENT';
      if (source.status === 'checked_out') return 'LEFT';
      return 'REGISTERED';
    }
  }
});

// Add field resolvers
AttendeeTC.addResolver({
  name: 'canCheckIn',
  type: 'Boolean!',
  description: 'Check if attendee can be checked in',
  resolve: ({ source }) => {
    return source.status !== 'checked_in' && 
           source.status !== 'no_show';
  }
});

AttendeeTC.addResolver({
  name: 'canCheckOut',
  type: 'Boolean!',
  description: 'Check if attendee can be checked out',
  resolve: ({ source }) => {
    return source.status === 'checked_in';
  }
});

AttendeeTC.addResolver({
  name: 'canMarkNoShow',
  type: 'Boolean!',
  description: 'Check if attendee can be marked as no-show',
  resolve: ({ source }) => {
    return source.status !== 'checked_in' && 
           source.status !== 'checked_out' &&
           source.status !== 'no_show';
  }
});

export { AttendeeTC }; 