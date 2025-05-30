import { hasRole } from '../../lib/guards.js';
import {
  SongRequestWithComputed,
  SongRequestInputTC
} from '../../gcm-type-composers/music/song-request.type.js';

// Create Request Mutation
SongRequestWithComputed.addResolver({
  name: 'createRequest',
  type: SongRequestWithComputed,
  args: {
    input: SongRequestInputTC
  },
  resolve: async ({ args, context }) => {
    return context.services.songRequest.createRequestFromSwipe(context, {
      userId: context.user._id,
      songId: args.input.songId,
      location: args.input.location,
      event: args.input.event
    });
  }
});

// Approve Request Mutation
SongRequestWithComputed.addResolver({
  name: 'approveRequest',
  type: SongRequestWithComputed,
  args: {
    requestId: 'MongoID!'
  },
  resolve: async ({ args, context }) => {
    return context.services.songRequest.approveRequest(context, args.requestId);
  }
}).use(hasRole('DJ'));

// Reject Request Mutation
SongRequestWithComputed.addResolver({
  name: 'rejectRequest',
  type: SongRequestWithComputed,
  args: {
    requestId: 'MongoID!',
    reason: 'String!'
  },
  resolve: async ({ args, context }) => {
    return context.services.songRequest.rejectRequest(context, args.requestId, args.reason);
  }
}).use(hasRole('DJ'));

// Mark Request as Played Mutation
SongRequestWithComputed.addResolver({
  name: 'markRequestAsPlayed',
  type: SongRequestWithComputed,
  args: {
    requestId: 'MongoID!'
  },
  resolve: async ({ args, context }) => {
    return context.services.songRequest.markRequestAsPlayed(context, args.requestId);
  }
}).use(hasRole('DJ')); 