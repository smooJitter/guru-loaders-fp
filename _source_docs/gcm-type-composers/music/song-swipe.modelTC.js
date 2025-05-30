import { composeWithMongoose } from 'graphql-compose-mongoose';
import { typeConfig } from '../../config/type-config.js';
import { addStandardFields, addComputedFields } from '../../lib/field-helper.js';
import { createTypeComposer } from '../../lib/type-helper.js';
import { SongSwipe } from '../../domain-models/music/song-swipe.model.js';

// Create base type composer
const SongSwipeTC = composeWithMongoose(SongSwipe, {
  ...typeConfig.typeComposerConfig.options
});

// Add standard fields
const SongSwipeWithStandardFields = addStandardFields(SongSwipeTC, {
  direction: {
    type: 'String!',
    description: 'Direction of the swipe (left, right, up)'
  },
  reason: {
    type: 'String',
    description: 'Reason for the swipe direction'
  },
  location: {
    type: 'String',
    description: 'Location where the swipe occurred'
  },
  event: {
    type: 'String',
    description: 'Event context for the swipe'
  }
});

// Add computed fields
const SongSwipeWithComputed = addComputedFields(SongSwipeWithStandardFields, {
  age: {
    type: 'Float!',
    description: 'Age of the swipe in milliseconds',
    resolve: (source) => Date.now() - source.createdAt
  }
});

// Add input types
const SongSwipeInputTC = createTypeComposer({
  name: 'SongSwipeInput',
  fields: {
    ...typeConfig.inputTypes.create,
    songId: 'MongoID!',
    direction: 'String!',
    reason: 'String',
    location: 'String',
    event: 'String'
  }
});

const SongSwipeFilterInputTC = createTypeComposer({
  name: 'SongSwipeFilterInput',
  fields: {
    direction: 'String',
    startDate: 'Date',
    endDate: 'Date',
    location: 'String',
    event: 'String'
  }
});

const SongSwipePaginationInputTC = createTypeComposer({
  name: 'SongSwipePaginationInput',
  fields: {
    page: 'Int!',
    limit: 'Int!'
  }
});

// Add stats type
const SongSwipeStatsTC = createTypeComposer({
  name: 'SongSwipeStats',
  fields: {
    total: 'Int!',
    left: 'Int!',
    right: 'Int!',
    up: 'Int!',
    matchRate: 'Float!',
    uniqueUsers: 'Int!',
    genrePreferences: '[GenrePreference!]!'
  }
});

const GenrePreferenceTC = createTypeComposer({
  name: 'GenrePreference',
  fields: {
    genre: 'String!',
    count: 'Int!',
    percentage: 'Float!'
  }
});

// Add compatibility type
const SwipeCompatibilityTC = createTypeComposer({
  name: 'SwipeCompatibility',
  fields: {
    matchCount: 'Int!',
    matchPercentage: 'Float!',
    genreSimilarity: 'Float!',
    totalScore: 'Float!'
  }
});

export {
  SongSwipeTC,
  SongSwipeWithStandardFields,
  SongSwipeWithComputed,
  SongSwipeInputTC,
  SongSwipeFilterInputTC,
  SongSwipePaginationInputTC,
  SongSwipeStatsTC,
  GenrePreferenceTC,
  SwipeCompatibilityTC
}; 