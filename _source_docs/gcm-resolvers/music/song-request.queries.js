import { builder } from '../../builder.js';
import { hasRole } from '../../lib/guards.js';
import {
  SongRequestWithComputed,
  SongRequestFilterInputTC,
  SongRequestPaginationInputTC,
  SongRequestStatsTC
} from '../../gcm-type-composers/music/song-request.type.js';

// Get Pending Requests Query
SongRequestWithComputed.addResolver({
  name: 'pendingRequests',
  type: [SongRequestWithComputed],
  args: {
    pagination: SongRequestPaginationInputTC
  },
  resolve: async ({ args, context }) => {
    const { page = 1, limit = 20 } = args.pagination || {};
    const skip = (page - 1) * limit;

    return context.services.db.SongRequest
      .find({ status: 'pending' })
      .sort({ priority: -1, requestedAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('songId')
      .populate('userId', 'username');
  }
}).use(hasRole('DJ'));

// Get User Requests Query
SongRequestWithComputed.addResolver({
  name: 'userRequests',
  type: [SongRequestWithComputed],
  args: {
    filter: SongRequestFilterInputTC,
    pagination: SongRequestPaginationInputTC
  },
  resolve: async ({ args, context }) => {
    const { page = 1, limit = 20 } = args.pagination || {};
    const skip = (page - 1) * limit;

    const query = { userId: context.user._id };
    if (args.filter?.status) query.status = args.filter.status;
    if (args.filter?.startDate) query.requestedAt = { $gte: new Date(args.filter.startDate) };
    if (args.filter?.endDate) query.requestedAt = { ...query.requestedAt, $lte: new Date(args.filter.endDate) };

    return context.services.db.SongRequest
      .find(query)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('songId');
  }
});

// Get Request Stats Query
SongRequestWithComputed.addResolver({
  name: 'requestStats',
  type: SongRequestStatsTC,
  resolve: async ({ context }) => {
    const stats = await context.services.db.SongRequest.aggregate([
      { $match: { userId: context.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          creditsSpent: { $sum: '$creditsSpent' }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      played: 0,
      totalCreditsSpent: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
      result.totalCreditsSpent += stat.creditsSpent;
    });

    return result;
  }
}); 