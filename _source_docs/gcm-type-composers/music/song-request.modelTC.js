import { composeWithMongoose } from 'graphql-compose-mongoose';
import { typeConfig } from '../../config/type-config.js';
import { addStandardFields, addComputedFields } from '../../lib/field-helper.js';
import { createTypeComposer } from '../../lib/type-helper.js';
import { SongRequest } from '../../domain-models/music/song-request.model.js';

// Create base type composer
const SongRequestTC = composeWithMongoose(SongRequest, {
  ...typeConfig.typeComposerConfig.options
});

// Add standard fields
const SongRequestWithStandardFields = addStandardFields(SongRequestTC, {
  status: {
    type: 'String!',
    description: 'Status of the request (pending, approved, rejected, played)'
  },
  creditsSpent: {
    type: 'Float!',
    description: 'Number of credits spent on this request'
  },
  requestedAt: {
    type: 'Date!',
    description: 'When the request was made'
  },
  playedAt: {
    type: 'Date',
    description: 'When the song was played'
  },
  rejectionReason: {
    type: 'String',
    description: 'Reason for rejection if applicable'
  },
  priority: {
    type: 'Float!',
    description: 'Request priority'
  }
});

// Add computed fields
const SongRequestWithComputed = addComputedFields(SongRequestWithStandardFields, {
  age: {
    type: 'Float!',
    description: 'Age of the request in milliseconds',
    resolve: (source) => Date.now() - source.requestedAt
  }
});

// Add input types
const SongRequestInputTC = createTypeComposer({
  name: 'SongRequestInput',
  fields: {
    ...typeConfig.inputTypes.create,
    songId: 'MongoID!',
    location: 'String',
    event: 'String'
  }
});

const SongRequestFilterInputTC = createTypeComposer({
  name: 'SongRequestFilterInput',
  fields: {
    status: 'String',
    startDate: 'Date',
    endDate: 'Date'
  }
});

const SongRequestPaginationInputTC = createTypeComposer({
  name: 'SongRequestPaginationInput',
  fields: {
    page: 'Int!',
    limit: 'Int!'
  }
});

// Add stats type
const SongRequestStatsTC = createTypeComposer({
  name: 'SongRequestStats',
  fields: {
    total: 'Int!',
    pending: 'Int!',
    approved: 'Int!',
    rejected: 'Int!',
    played: 'Int!',
    totalCreditsSpent: 'Float!'
  }
});

export {
  SongRequestTC,
  SongRequestWithStandardFields,
  SongRequestWithComputed,
  SongRequestInputTC,
  SongRequestFilterInputTC,
  SongRequestPaginationInputTC,
  SongRequestStatsTC
}; 