import { schemaComposer } from 'graphql-compose';
import { SongRequestTC } from '../../gcm-type-composers/music/song-request.modelTC.js';
import { isAuthenticated, hasRole } from '../../lib/guards.js';
import { SONG_REQUEST_TOPICS } from '../../configs/music-constants.js';
import { pubsub } from '../../lib/pubsub.js';

const subscriptionResolvers = {
  songRequestCreated: {
    type: SongRequestTC,
    args: {
      djId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_REQUEST_TOPICS.REQUEST_CREATED}.${args.djId}`),
  },
  songRequestStatusChanged: {
    type: SongRequestTC,
    args: {
      requestId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_REQUEST_TOPICS.STATUS_CHANGED}.${args.requestId}`),
  },
  songRequestCancelled: {
    type: SongRequestTC,
    args: {
      requestId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_REQUEST_TOPICS.REQUEST_CANCELLED}.${args.requestId}`),
  },
  queueUpdated: {
    type: [SongRequestTC],
    args: {
      djId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_REQUEST_TOPICS.QUEUE_UPDATED}.${args.djId}`),
  },
};

// Apply guards to subscription resolvers
const protectedResolvers = {
  songRequestCreated: {
    ...subscriptionResolvers.songRequestCreated,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      await hasRole('dj')(rp);
      return subscriptionResolvers.songRequestCreated.subscribe(rp);
    },
  },
  songRequestStatusChanged: {
    ...subscriptionResolvers.songRequestStatusChanged,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songRequestStatusChanged.subscribe(rp);
    },
  },
  songRequestCancelled: {
    ...subscriptionResolvers.songRequestCancelled,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songRequestCancelled.subscribe(rp);
    },
  },
  queueUpdated: {
    ...subscriptionResolvers.queueUpdated,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      await hasRole('dj')(rp);
      return subscriptionResolvers.queueUpdated.subscribe(rp);
    },
  },
};

// Add to schema
schemaComposer.Subscription.addFields(protectedResolvers);

export default protectedResolvers; 