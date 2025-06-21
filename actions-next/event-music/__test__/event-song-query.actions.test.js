import * as eventSongActionsModule from '../song/event-song-query.actions.js';
import * as sanitizeSongModule from '../lib/sanitizeSong.js';
const sanitizeSong = sanitizeSongModule.default || sanitizeSongModule;

const actionsArr = eventSongActionsModule.default || eventSongActionsModule;
const actions = Object.fromEntries(actionsArr.map(a => [a.name, a]));

const mockSong = { _id: '1', title: 'Test Song', artist: 'Test Artist', album: 'Test Album', genre: 'Pop', ratings: [{ value: 5 }] };
const mockContext = () => ({
  models: {
    Song: {
      findById: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
      countDocuments: jest.fn()
    }
  }
});

describe('event-song-query.actions.js', () => {
  describe('sanitizeSong', () => {
    it('returns the song unchanged (default)', () => {
      expect(sanitizeSong(mockSong)).toEqual(mockSong);
    });
    it('returns null if input is null', () => {
      expect(sanitizeSong(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizeSong(undefined)).toBeUndefined();
    });
  });

  describe('getSongById', () => {
    it('returns sanitized song for valid id', async () => {
      const context = mockContext();
      context.models.Song.findById.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(mockSong) }) });
      const { getSongById } = actions;
      const result = await getSongById.method({ context, id: '1' });
      expect(result).toEqual(mockSong);
    });
    it('returns null for not found', async () => {
      const context = mockContext();
      context.models.Song.findById.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const { getSongById } = actions;
      const result = await getSongById.method({ context, id: '2' });
      expect(result).toBeNull();
    });
    it('throws for missing id', async () => {
      const context = mockContext();
      const { getSongById } = actions;
      await expect(getSongById.method({ context })).rejects.toThrow();
    });
    it('throws for undefined id', async () => {
      const context = mockContext();
      const { getSongById } = actions;
      await expect(getSongById.method({ context, id: undefined })).rejects.toThrow();
    });
    it('throws for null id', async () => {
      const context = mockContext();
      const { getSongById } = actions;
      await expect(getSongById.method({ context, id: null })).rejects.toThrow();
    });
  });

  describe('listSongs', () => {
    it('returns sanitized songs array', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve([mockSong]) }) });
      const { listSongs } = actions;
      const result = await listSongs.method({ context });
      expect(result).toEqual([mockSong]);
    });
    it('returns empty array if no songs', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve([]) }) });
      const { listSongs } = actions;
      const result = await listSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('throws if context is undefined', async () => {
      const { listSongs } = actions;
      await expect(listSongs.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { listSongs } = actions;
      await expect(listSongs.method({ context: null })).rejects.toThrow();
    });
    it('returns empty array if songs is null', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(null) }) });
      const { listSongs } = actions;
      const result = await listSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if songs is undefined', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(undefined) }) });
      const { listSongs } = actions;
      const result = await listSongs.method({ context });
      expect(result).toEqual([]);
    });
  });

  describe('searchSongs', () => {
    it('returns songs and pagination', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([mockSong]) }) }) }) })
      });
      context.models.Song.countDocuments.mockResolvedValue(1);
      const { searchSongs } = actions;
      const result = await searchSongs.method({ context, query: 'Test', limit: 1, offset: 0 });
      expect(result.songs).toEqual([mockSong]);
      expect(result.pagination).toEqual({ total: 1, limit: 1, offset: 0 });
    });
    it('returns empty songs and correct pagination if no results', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) })
      });
      context.models.Song.countDocuments.mockResolvedValue(0);
      const { searchSongs } = actions;
      const result = await searchSongs.method({ context, query: 'Test', limit: 1, offset: 0 });
      expect(result.songs).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, limit: 1, offset: 0 });
    });
    it('throws for missing query', async () => {
      const context = mockContext();
      const { searchSongs } = actions;
      await expect(searchSongs.method({ context })).rejects.toThrow();
    });
    it('returns correct pagination for offset/limit edge cases', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([mockSong]) }) }) }) })
      });
      context.models.Song.countDocuments.mockResolvedValue(5);
      const { searchSongs } = actions;
      const result = await searchSongs.method({ context, query: 'Test', limit: 2, offset: 4 });
      expect(result.pagination).toEqual({ total: 5, limit: 2, offset: 4 });
    });
    it('returns empty songs if DB returns null', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }) }) })
      });
      context.models.Song.countDocuments.mockResolvedValue(0);
      const { searchSongs } = actions;
      const result = await searchSongs.method({ context, query: 'Test', limit: 1, offset: 0 });
      expect(result.songs).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, limit: 1, offset: 0 });
    });
    it('returns empty songs if DB returns undefined', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(undefined) }) }) }) })
      });
      context.models.Song.countDocuments.mockResolvedValue(0);
      const { searchSongs } = actions;
      const result = await searchSongs.method({ context, query: 'Test', limit: 1, offset: 0 });
      expect(result.songs).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, limit: 1, offset: 0 });
    });
  });

  const arrayActions = [
    { name: 'getSongsByStatus', param: 'status', value: 'active' },
    { name: 'getSongsByArtist', param: 'artist', value: 'Test Artist' },
    { name: 'getSongsByAlbum', param: 'album', value: 'Test Album' },
    { name: 'getSongsByGenre', param: 'genre', value: 'Pop' }
  ];
  arrayActions.forEach(({ name, param, value }) => {
    describe(name, () => {
      it('returns sanitized songs array', async () => {
        const context = mockContext();
        context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve([mockSong]) }) });
        const action = actions[name];
        const result = await action.method({ context, [param]: value });
        expect(result).toEqual([mockSong]);
      });
      it('returns empty array if no results', async () => {
        const context = mockContext();
        context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve([]) }) });
        const action = actions[name];
        const result = await action.method({ context, [param]: value });
        expect(result).toEqual([]);
      });
      it('throws for missing param', async () => {
        const context = mockContext();
        const action = actions[name];
        await expect(action.method({ context })).rejects.toThrow();
      });
      it('throws for undefined param', async () => {
        const context = mockContext();
        const action = actions[name];
        await expect(action.method({ context, [param]: undefined })).rejects.toThrow();
      });
      it('throws for null param', async () => {
        const context = mockContext();
        const action = actions[name];
        await expect(action.method({ context, [param]: null })).rejects.toThrow();
      });
      it('returns empty array if DB returns null', async () => {
        const context = mockContext();
        context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(null) }) });
        const action = actions[name];
        const result = await action.method({ context, [param]: value });
        expect(result).toEqual([]);
      });
      it('returns empty array if DB returns undefined', async () => {
        const context = mockContext();
        context.models.Song.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(undefined) }) });
        const action = actions[name];
        const result = await action.method({ context, [param]: value });
        expect(result).toEqual([]);
      });
    });
  });

  describe('getTopRatedSongs', () => {
    it('returns sanitized songs array', async () => {
      const context = mockContext();
      context.models.Song.aggregate.mockResolvedValue([mockSong]);
      const { getTopRatedSongs } = actions;
      const result = await getTopRatedSongs.method({ context });
      expect(result).toEqual([mockSong]);
    });
    it('returns empty array if no results', async () => {
      const context = mockContext();
      context.models.Song.aggregate.mockResolvedValue([]);
      const { getTopRatedSongs } = actions;
      const result = await getTopRatedSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if aggregate returns null', async () => {
      const context = mockContext();
      context.models.Song.aggregate.mockResolvedValue(null);
      const { getTopRatedSongs } = actions;
      const result = await getTopRatedSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if aggregate returns undefined', async () => {
      const context = mockContext();
      context.models.Song.aggregate.mockResolvedValue(undefined);
      const { getTopRatedSongs } = actions;
      const result = await getTopRatedSongs.method({ context });
      expect(result).toEqual([]);
    });
  });

  describe('getMostPlayedSongs', () => {
    it('returns sanitized songs array', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([mockSong]) }) }) }) });
      const { getMostPlayedSongs } = actions;
      const result = await getMostPlayedSongs.method({ context });
      expect(result).toEqual([mockSong]);
    });
    it('returns empty array if no results', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) });
      const { getMostPlayedSongs } = actions;
      const result = await getMostPlayedSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if DB returns null', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }) }) });
      const { getMostPlayedSongs } = actions;
      const result = await getMostPlayedSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if DB returns undefined', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(undefined) }) }) }) });
      const { getMostPlayedSongs } = actions;
      const result = await getMostPlayedSongs.method({ context });
      expect(result).toEqual([]);
    });
  });

  describe('getRecentSongs', () => {
    it('returns sanitized songs array', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([mockSong]) }) }) }) });
      const { getRecentSongs } = actions;
      const result = await getRecentSongs.method({ context });
      expect(result).toEqual([mockSong]);
    });
    it('returns empty array if no results', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }) });
      const { getRecentSongs } = actions;
      const result = await getRecentSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if DB returns null', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(null) }) }) }) });
      const { getRecentSongs } = actions;
      const result = await getRecentSongs.method({ context });
      expect(result).toEqual([]);
    });
    it('returns empty array if DB returns undefined', async () => {
      const context = mockContext();
      context.models.Song.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve(undefined) }) }) }) });
      const { getRecentSongs } = actions;
      const result = await getRecentSongs.method({ context });
      expect(result).toEqual([]);
    });
  });
}); 