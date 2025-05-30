import { composeWithMongoose } from 'graphql-compose-mongoose';
import { typeConfig } from '../../config/type-config.js';
import { addStandardFields, addComputedFields } from '../../lib/field-helper.js';
import { createTypeComposer } from '../../lib/type-helper.js';
import { Song } from '../../domain-models/music/song.model.js';

// Create base type composer
const SongTC = composeWithMongoose(Song, {
  ...typeConfig.typeComposerConfig.options
});

// Add standard fields
const SongWithStandardFields = addStandardFields(SongTC, {
  title: {
    type: 'String!',
    description: 'Title of the song'
  },
  duration: {
    type: 'Float!',
    description: 'Duration of the song in seconds'
  },
  trackNumber: {
    type: 'Int',
    description: 'Track number in the album'
  },
  genre: {
    type: 'String',
    description: 'Genre of the song'
  },
  releaseDate: {
    type: 'Date',
    description: 'Release date of the song'
  },
  isExplicit: {
    type: 'Boolean!',
    description: 'Whether the song contains explicit content'
  },
  popularity: {
    type: 'Float!',
    description: 'Popularity score of the song'
  },
  playCount: {
    type: 'Int!',
    description: 'Number of times the song has been played'
  },
  lastPlayedAt: {
    type: 'Date',
    description: 'When the song was last played'
  }
});

// Add computed fields
const SongWithComputed = addComputedFields(SongWithStandardFields, {
  displayName: {
    type: 'String!',
    description: 'Formatted display name of the song',
    resolve: (source) => `${source.title}${source.isExplicit ? ' (E)' : ''}`
  },
  formattedDuration: {
    type: 'String!',
    description: 'Duration formatted as MM:SS',
    resolve: (source) => {
      const minutes = Math.floor(source.duration / 60);
      const seconds = Math.floor(source.duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
});

// Add input types
const SongInputTC = createTypeComposer({
  name: 'SongInput',
  fields: {
    ...typeConfig.inputTypes.create,
    title: 'String!',
    duration: 'Float!',
    trackNumber: 'Int',
    genre: 'String',
    releaseDate: 'Date',
    isExplicit: 'Boolean!'
  }
});

const SongFilterInputTC = createTypeComposer({
  name: 'SongFilterInput',
  fields: {
    title: 'String',
    genre: 'String',
    isExplicit: 'Boolean',
    minPopularity: 'Float',
    maxPopularity: 'Float'
  }
});

const SongPaginationInputTC = createTypeComposer({
  name: 'SongPaginationInput',
  fields: {
    page: 'Int!',
    limit: 'Int!'
  }
});

// Add stats type
const SongStatsTC = createTypeComposer({
  name: 'SongStats',
  fields: {
    total: 'Int!',
    totalDuration: 'Float!',
    averagePopularity: 'Float!',
    totalPlayCount: 'Int!',
    genreDistribution: '[GenreCount!]!'
  }
});

const GenreCountTC = createTypeComposer({
  name: 'GenreCount',
  fields: {
    genre: 'String!',
    count: 'Int!'
  }
});

export {
  SongTC,
  SongWithStandardFields,
  SongWithComputed,
  SongInputTC,
  SongFilterInputTC,
  SongPaginationInputTC,
  SongStatsTC,
  GenreCountTC
}; 