import { schemaComposer } from 'graphql-compose';
import { SongTC } from '../../gcm-type-composers/music/song.modelTC.js';
import { isAuthenticated } from '../../lib/guards.js';
import { SONG_TOPICS } from '../../configs/music-constants.js';
import { pubsub } from '../../lib/pubsub.js';

const subscriptionResolvers = {
  songUpdated: {
    type: SongTC,
    args: {
      id: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_TOPICS.SONG_UPDATED}.${args.id}`),
  },
  songPopularityChanged: {
    type: SongTC,
    args: {
      id: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_TOPICS.POPULARITY_CHANGED}.${args.id}`),
  },
  songPlayCountIncremented: {
    type: SongTC,
    args: {
      id: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_TOPICS.PLAY_COUNT_INCREMENTED}.${args.id}`),
  },
  songStatusChanged: {
    type: SongTC,
    args: {
      id: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_TOPICS.STATUS_CHANGED}.${args.id}`),
  },
};

// Apply guards to subscription resolvers
const protectedResolvers = {
  songUpdated: {
    ...subscriptionResolvers.songUpdated,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songUpdated.subscribe(rp);
    },
  },
  songPopularityChanged: {
    ...subscriptionResolvers.songPopularityChanged,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songPopularityChanged.subscribe(rp);
    },
  },
  songPlayCountIncremented: {
    ...subscriptionResolvers.songPlayCountIncremented,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songPlayCountIncremented.subscribe(rp);
    },
  },
  songStatusChanged: {
    ...subscriptionResolvers.songStatusChanged,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songStatusChanged.subscribe(rp);
    },
  },
};

// Add to schema
schemaComposer.Subscription.addFields(protectedResolvers);

export default protectedResolvers; 