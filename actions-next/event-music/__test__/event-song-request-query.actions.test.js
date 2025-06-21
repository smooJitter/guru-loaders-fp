import * as eventSongRequestActionsModule from '../song-request/event-song-request-query.actions.js';
const actionsArr = eventSongRequestActionsModule.default || eventSongRequestActionsModule;
const actions = Object.fromEntries(actionsArr.map(a => [a.name, a]));

const mockRequest = { _id: '1', userId: 'u1', songId: 's1', status: 'pending' };
const mockContext = () => ({
  models: {
    SongRequest: {
      find: jest.fn(),
      countDocuments: jest.fn(),
      getPendingRequests: undefined
    }
  }
});

describe('event-song-request-query.actions.js', () => {
  describe('getUserRequests', () => {
    it('returns requests and pagination', async () => {
      const context = mockContext();
      context.models.SongRequest.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => Promise.resolve([mockRequest]) }) }) }) }) });
      context.models.SongRequest.countDocuments.mockResolvedValue(1);
      const { getUserRequests } = actions;
      const result = await getUserRequests.method({ context, userId: 'u1', page: 1, limit: 1 });
      expect(result.requests).toEqual([mockRequest]);
      expect(result.pagination).toEqual({ total: 1, page: 1, limit: 1, pages: 1 });
    });
    it('returns empty array if no requests', async () => {
      const context = mockContext();
      context.models.SongRequest.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => Promise.resolve([]) }) }) }) }) });
      context.models.SongRequest.countDocuments.mockResolvedValue(0);
      const { getUserRequests } = actions;
      const result = await getUserRequests.method({ context, userId: 'u1', page: 1, limit: 1 });
      expect(result.requests).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, page: 1, limit: 1, pages: 0 });
    });
    it('throws for missing userId', async () => {
      const context = mockContext();
      const { getUserRequests } = actions;
      await expect(getUserRequests.method({ context })).rejects.toThrow();
    });
    it('throws for undefined userId', async () => {
      const context = mockContext();
      const { getUserRequests } = actions;
      await expect(getUserRequests.method({ context, userId: undefined })).rejects.toThrow();
    });
    it('throws for null userId', async () => {
      const context = mockContext();
      const { getUserRequests } = actions;
      await expect(getUserRequests.method({ context, userId: null })).rejects.toThrow();
    });
    it('returns correct pagination for page=0, limit=0', async () => {
      const context = mockContext();
      context.models.SongRequest.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => Promise.resolve([]) }) }) }) }) });
      context.models.SongRequest.countDocuments.mockResolvedValue(0);
      const { getUserRequests } = actions;
      const result = await getUserRequests.method({ context, userId: 'u1', page: 0, limit: 0 });
      expect(result.pagination).toEqual({ total: 0, page: 0, limit: 0, pages: NaN });
    });
    it('returns correct pagination for large total', async () => {
      const context = mockContext();
      context.models.SongRequest.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => Promise.resolve([]) }) }) }) }) });
      context.models.SongRequest.countDocuments.mockResolvedValue(1000);
      const { getUserRequests } = actions;
      const result = await getUserRequests.method({ context, userId: 'u1', page: 1, limit: 10 });
      expect(result.pagination).toEqual({ total: 1000, page: 1, limit: 10, pages: 100 });
    });
    it('throws if context is undefined', async () => {
      const { getUserRequests } = actions;
      await expect(getUserRequests.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getUserRequests } = actions;
      await expect(getUserRequests.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getPendingRequests', () => {
    it('uses getPendingRequests static method if present', async () => {
      const context = mockContext();
      context.models.SongRequest.getPendingRequests = jest.fn().mockResolvedValue([mockRequest]);
      context.models.SongRequest.countDocuments.mockResolvedValue(1);
      const { getPendingRequests } = actions;
      const result = await getPendingRequests.method({ context, page: 1, limit: 1 });
      expect(result.requests).toEqual([mockRequest]);
      expect(result.pagination).toEqual({ total: 1, page: 1, limit: 1, pages: 1 });
    });
    it('falls back to find if getPendingRequests is not present', async () => {
      const context = mockContext();
      context.models.SongRequest.getPendingRequests = undefined;
      context.models.SongRequest.find.mockReturnValue({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ lean: () => Promise.resolve([mockRequest]) }) }) }) }) });
      context.models.SongRequest.countDocuments.mockResolvedValue(1);
      const { getPendingRequests } = actions;
      const result = await getPendingRequests.method({ context, page: 1, limit: 1 });
      expect(result.requests).toEqual([mockRequest]);
      expect(result.pagination).toEqual({ total: 1, page: 1, limit: 1, pages: 1 });
    });
    it('returns empty array if no requests', async () => {
      const context = mockContext();
      context.models.SongRequest.getPendingRequests = jest.fn().mockResolvedValue([]);
      context.models.SongRequest.countDocuments.mockResolvedValue(0);
      const { getPendingRequests } = actions;
      const result = await getPendingRequests.method({ context, page: 1, limit: 1 });
      expect(result.requests).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, page: 1, limit: 1, pages: 0 });
    });
    it('returns empty array if getPendingRequests returns undefined', async () => {
      const context = mockContext();
      context.models.SongRequest.getPendingRequests = jest.fn().mockResolvedValue(undefined);
      context.models.SongRequest.countDocuments.mockResolvedValue(0);
      const { getPendingRequests } = actions;
      const result = await getPendingRequests.method({ context, page: 1, limit: 1 });
      expect(result.requests).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, page: 1, limit: 1, pages: 0 });
    });
    it('returns empty array if getPendingRequests returns null', async () => {
      const context = mockContext();
      context.models.SongRequest.getPendingRequests = jest.fn().mockResolvedValue(null);
      context.models.SongRequest.countDocuments.mockResolvedValue(0);
      const { getPendingRequests } = actions;
      const result = await getPendingRequests.method({ context, page: 1, limit: 1 });
      expect(result.requests).toEqual([]);
      expect(result.pagination).toEqual({ total: 0, page: 1, limit: 1, pages: 0 });
    });
    it('throws if context is undefined', async () => {
      const { getPendingRequests } = actions;
      await expect(getPendingRequests.method({})).rejects.toThrow();
    });
    it('throws if context is null', async () => {
      const { getPendingRequests } = actions;
      await expect(getPendingRequests.method({ context: null })).rejects.toThrow();
    });
  });

  describe('getRequestsByStatus', () => {
    it('returns empty array (future-proofed)', async () => {
      const context = mockContext();
      const { getRequestsByStatus } = actions;
      const result = await getRequestsByStatus.method({ context, status: 'pending' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('getRequestsBySong', () => {
    it('returns empty array (future-proofed)', async () => {
      const context = mockContext();
      const { getRequestsBySong } = actions;
      const result = await getRequestsBySong.method({ context, songId: 's1' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });
}); 