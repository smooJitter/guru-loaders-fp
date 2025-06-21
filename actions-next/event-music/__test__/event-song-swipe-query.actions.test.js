import * as eventSongSwipeActionsModule from '../song-swipe/event-song-swipe-query.actions.js';
const actionsArr = eventSongSwipeActionsModule.default || eventSongSwipeActionsModule;
const actions = Object.fromEntries(actionsArr.map(a => [a.name, a]));
import { getUserPreferencesFromSwipes } from '../lib/songSwipePreferences.js';
import { buildPaginationMeta } from '../lib/pagination.js';

const mockSwipe = { _id: 'sw1', userId: 'u1', songId: { _id: 's1', genre: 'Pop', artist: { _id: 'a1' }, album: { _id: 'al1' } }, direction: 'right', timestamp: new Date() };
const mockSong = { _id: 's1', title: 'Song', artist: 'Artist', album: 'Album', genre: 'Pop', playCount: 10 };
const mockContext = () => ({
  models: {
    SongSwipe: {
      find: jest.fn(),
      countDocuments: jest.fn(),
      distinct: jest.fn(),
      aggregate: jest.fn()
    },
    Song: {
      find: jest.fn(),
      aggregate: jest.fn()
    }
  }
});

describe('event-song-swipe-query.actions.js', () => {
  describe('getHistory', () => {
    it('returns swipes and pagination', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => ({ exec: () => Promise.resolve([mockSwipe]) }) }) }) }) }) });
      context.models.SongSwipe.countDocuments.mockResolvedValue(1);
      const { getHistory } = actions;
      const result = await getHistory.method({ context, userId: 'u1', page: 1, limit: 1 });
      expect(result.swipes).toEqual([mockSwipe]);
      expect(result.pagination).toEqual(buildPaginationMeta(1, 1, 1));
    });
    it('returns empty array and correct pagination if no swipes', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) }) });
      context.models.SongSwipe.countDocuments.mockResolvedValue(0);
      const { getHistory } = actions;
      const result = await getHistory.method({ context, userId: 'u1', page: 1, limit: 1 });
      expect(result.swipes).toEqual([]);
      expect(result.pagination).toEqual(buildPaginationMeta(0, 1, 1));
    });
    it('returns correct pagination for page=0, limit=0', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) }) });
      context.models.SongSwipe.countDocuments.mockResolvedValue(0);
      const { getHistory } = actions;
      const result = await getHistory.method({ context, userId: 'u1', page: 0, limit: 0 });
      expect(result.pagination).toEqual(buildPaginationMeta(0, 0, 0));
    });
    it('returns correct pagination for large total', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) }) }) });
      context.models.SongSwipe.countDocuments.mockResolvedValue(1000);
      const { getHistory } = actions;
      const result = await getHistory.method({ context, userId: 'u1', page: 1, limit: 10 });
      expect(result.pagination).toEqual(buildPaginationMeta(1000, 1, 10));
    });
    it('throws for missing userId', async () => {
      const context = mockContext();
      const { getHistory } = actions;
      await expect(getHistory.method({ context })).rejects.toThrow();
    });
    it('throws if context is undefined', async () => {
      const { getHistory } = actions;
      await expect(getHistory.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getHistory } = actions;
      await expect(getHistory.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getUserPreferences', () => {
    it('returns preferences from right swipes', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ populate: () => ({ lean: () => Promise.resolve([mockSwipe]) }) });
      const { getUserPreferences } = actions;
      const result = await getUserPreferences.method({ context, userId: 'u1' });
      expect(result).toEqual(getUserPreferencesFromSwipes([mockSwipe]));
    });
    it('returns empty preferences if no swipes', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ populate: () => ({ lean: () => Promise.resolve([]) }) });
      const { getUserPreferences } = actions;
      const result = await getUserPreferences.method({ context, userId: 'u1' });
      expect(result).toEqual(getUserPreferencesFromSwipes([]));
    });
    it('throws for missing userId', async () => {
      const context = mockContext();
      const { getUserPreferences } = actions;
      await expect(getUserPreferences.method({ context })).rejects.toThrow();
    });
    it('throws if context is undefined', async () => {
      const { getUserPreferences } = actions;
      await expect(getUserPreferences.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getUserPreferences } = actions;
      await expect(getUserPreferences.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getUserCompatibility', () => {
    it('returns compatibility stats', async () => {
      const context = mockContext();
      context.models.SongSwipe.aggregate.mockResolvedValueOnce([
        { _id: 'right', count: 2, songs: ['s1', 's2'] },
        { _id: 'left', count: 1, songs: ['s3'] }
      ]).mockResolvedValueOnce([
        { _id: 'right', count: 1, songs: ['s1'] },
        { _id: 'left', count: 1, songs: ['s4'] }
      ]);
      context.models.SongSwipe.find.mockImplementation(({ userId, direction }) => ({ select: () => ({ lean: () => Promise.resolve(
        userId === 'u1' ? [{ songId: 's1' }, { songId: 's2' }] : [{ songId: 's1' }] ) }) }));
      const { getUserCompatibility } = actions;
      const result = await getUserCompatibility.method({ context, userId: 'u1', otherUserId: 'u2' });
      expect(result.matchCount).toBe(1);
      expect(result.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.userStats.totalSwipes).toBe(3);
      expect(result.otherUserStats.totalSwipes).toBe(2);
      expect(Array.isArray(result.matchingSongs)).toBe(true);
    });
    it('returns zero matches if no overlap', async () => {
      const context = mockContext();
      context.models.SongSwipe.aggregate.mockResolvedValueOnce([
        { _id: 'right', count: 2, songs: ['s1', 's2'] }
      ]).mockResolvedValueOnce([
        { _id: 'right', count: 1, songs: ['s3'] }
      ]);
      context.models.SongSwipe.find.mockImplementation(({ userId, direction }) => ({ select: () => ({ lean: () => Promise.resolve(
        userId === 'u1' ? [{ songId: 's1' }, { songId: 's2' }] : [{ songId: 's3' }] ) }) }));
      const { getUserCompatibility } = actions;
      const result = await getUserCompatibility.method({ context, userId: 'u1', otherUserId: 'u2' });
      expect(result.matchCount).toBe(0);
      expect(result.matchingSongs).toEqual([]);
    });
    it('throws for missing userId or otherUserId', async () => {
      const context = mockContext();
      const { getUserCompatibility } = actions;
      await expect(getUserCompatibility.method({ context, userId: 'u1' })).rejects.toThrow();
      await expect(getUserCompatibility.method({ context, otherUserId: 'u2' })).rejects.toThrow();
    });
    it('throws if context is undefined', async () => {
      const { getUserCompatibility } = actions;
      await expect(getUserCompatibility.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getUserCompatibility } = actions;
      await expect(getUserCompatibility.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getSimilarUsers', () => {
    it('returns sorted user scores', async () => {
      const context = mockContext();
      context.models.SongSwipe.distinct.mockResolvedValue(['u2']);
      context.models.SongSwipe.find.mockImplementation(() => ({
        select: () => ({ lean: () => Promise.resolve([{ songId: 's1' }, { songId: 's2' }]) }),
        populate: () => ({ lean: () => Promise.resolve([{ songId: 's1', genre: 'Pop', artist: 'A', album: 'B' }]) })
      }));
      context.models.SongSwipe.aggregate.mockResolvedValue([
        { _id: 'right', count: 2, songs: ['s1', 's2'] },
        { _id: 'left', count: 1, songs: ['s3'] }
      ]);
      const { getUserPreferences, getUserCompatibility, getSimilarUsers } = actions;
      getUserPreferences.method = jest.fn().mockResolvedValue({ topGenres: [{ genre: 'Pop', count: 1 }], genres: { Pop: 1 } });
      getUserCompatibility.method = jest.fn().mockResolvedValue({ matchPercentage: 100, matchCount: 1 });
      const result = await getSimilarUsers.method({ context, userId: 'u1', limit: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
    it('returns empty array if no users', async () => {
      const context = mockContext();
      context.models.SongSwipe.distinct.mockResolvedValue([]);
      context.models.SongSwipe.find.mockImplementation(() => ({
        select: () => ({ lean: () => Promise.resolve([]) }),
        populate: () => ({ lean: () => Promise.resolve([]) })
      }));
      context.models.SongSwipe.aggregate.mockResolvedValue([
        { _id: 'right', count: 2, songs: ['s1', 's2'] },
        { _id: 'left', count: 1, songs: ['s3'] }
      ]);
      const { getUserPreferences, getUserCompatibility, getSimilarUsers } = actions;
      getUserPreferences.method = jest.fn().mockResolvedValue({ topGenres: [], genres: {} });
      getUserCompatibility.method = jest.fn().mockResolvedValue({ matchPercentage: 0, matchCount: 0 });
      const result = await getSimilarUsers.method({ context, userId: 'u1', limit: 1 });
      expect(result).toEqual([]);
    });
    it('throws for missing userId', async () => {
      const context = mockContext();
      const { getSimilarUsers } = actions;
      await expect(getSimilarUsers.method({ context })).rejects.toThrow();
    });
    it('throws if context is undefined', async () => {
      const { getSimilarUsers } = actions;
      await expect(getSimilarUsers.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getSimilarUsers } = actions;
      await expect(getSimilarUsers.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getUserMatches', () => {
    it('returns matching songs', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockImplementation(({ userId, direction }) => ({ select: () => ({ lean: () => Promise.resolve(
        userId === 'u1' ? [{ songId: 's1' }] : [{ songId: 's1' }, { songId: 's2' }] ) }) }));
      context.models.Song.find.mockReturnValue({ populate: () => ({ populate: () => ({ lean: () => Promise.resolve([mockSong]) }) }) });
      const { getUserMatches } = actions;
      const result = await getUserMatches.method({ context, userId: 'u1', otherUserId: 'u2' });
      expect(result).toEqual([mockSong]);
    });
    it('returns empty array if no matches', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockImplementation(({ userId, direction }) => ({ select: () => ({ lean: () => Promise.resolve([]) }) }));
      context.models.Song.find.mockReturnValue({ populate: () => ({ populate: () => ({ lean: () => Promise.resolve([]) }) }) });
      const { getUserMatches } = actions;
      const result = await getUserMatches.method({ context, userId: 'u1', otherUserId: 'u2' });
      expect(result).toEqual([]);
    });
    it('throws for missing userId or otherUserId', async () => {
      const context = mockContext();
      const { getUserMatches } = actions;
      await expect(getUserMatches.method({ context, userId: 'u1' })).rejects.toThrow();
      await expect(getUserMatches.method({ context, otherUserId: 'u2' })).rejects.toThrow();
    });
    it('throws if context is undefined', async () => {
      const { getUserMatches } = actions;
      await expect(getUserMatches.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getUserMatches } = actions;
      await expect(getUserMatches.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getRecommendations', () => {
    it('returns recommendations', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ songId: 's1', direction: 'right' }]) }) });
      context.models.Song.aggregate.mockResolvedValue([{ _id: 's2', title: 'Rec Song', genre: 'Pop' }]);
      context.models.Song.aggregate.mockResolvedValueOnce([{ _id: 'Pop', count: 1 }]).mockResolvedValueOnce([{ _id: 's2', title: 'Rec Song', genre: 'Pop' }]);
      const { getRecommendations } = actions;
      const result = await getRecommendations.method({ context, userId: 'u1', limit: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
    it('returns empty array if no recommendations', async () => {
      const context = mockContext();
      context.models.SongSwipe.find.mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ songId: 's1', direction: 'right' }]) }) });
      context.models.Song.aggregate.mockResolvedValueOnce([{ _id: 'Pop', count: 1 }]).mockResolvedValueOnce([]);
      const { getRecommendations } = actions;
      const result = await getRecommendations.method({ context, userId: 'u1', limit: 1 });
      expect(result).toEqual([]);
    });
    it('throws for missing userId', async () => {
      const context = mockContext();
      const { getRecommendations } = actions;
      await expect(getRecommendations.method({ context })).rejects.toThrow();
    });
    it('throws if context is undefined', async () => {
      const { getRecommendations } = actions;
      await expect(getRecommendations.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getRecommendations } = actions;
      await expect(getRecommendations.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getSwipesByGenre', () => {
    it('returns empty array (future-proofed)', async () => {
      const context = mockContext();
      const { getSwipesByGenre } = actions;
      const result = await getSwipesByGenre.method({ context, genre: 'Pop' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('getSwipesByTimeRange', () => {
    it('returns empty array (future-proofed)', async () => {
      const context = mockContext();
      const { getSwipesByTimeRange } = actions;
      const result = await getSwipesByTimeRange.method({ context, start: '2024-01-01', end: '2024-01-31' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });
}); 