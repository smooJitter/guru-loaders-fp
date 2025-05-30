import { schemaComposer } from 'graphql-compose';
import { SongSwipeTC } from '../../gcm-type-composers/music/song-swipe.modelTC.js';
import { isAuthenticated } from '../../lib/guards.js';
import { SONG_SWIPE_TOPICS } from '../../configs/music-constants.js';
import { pubsub } from '../../lib/pubsub.js';

const subscriptionResolvers = {
  songSwiped: {
    type: SongSwipeTC,
    args: {
      songId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_SWIPE_TOPICS.SONG_SWIPED}.${args.songId}`),
  },
  userSwipeUpdated: {
    type: SongSwipeTC,
    args: {
      userId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_SWIPE_TOPICS.USER_SWIPE_UPDATED}.${args.userId}`),
  },
  swipePreferencesChanged: {
    type: SongSwipeTC,
    args: {
      userId: 'MongoID!',
    },
    subscribe: (_, args) => pubsub.asyncIterator(`${SONG_SWIPE_TOPICS.PREFERENCES_CHANGED}.${args.userId}`),
  },
};

// Apply guards to subscription resolvers
const protectedResolvers = {
  songSwiped: {
    ...subscriptionResolvers.songSwiped,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.songSwiped.subscribe(rp);
    },
  },
  userSwipeUpdated: {
    ...subscriptionResolvers.userSwipeUpdated,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.userSwipeUpdated.subscribe(rp);
    },
  },
  swipePreferencesChanged: {
    ...subscriptionResolvers.swipePreferencesChanged,
    subscribe: async (rp) => {
      await isAuthenticated(rp);
      return subscriptionResolvers.swipePreferencesChanged.subscribe(rp);
    },
  },
};

// Add to schema
schemaComposer.Subscription.addFields(protectedResolvers);

export default protectedResolvers; 