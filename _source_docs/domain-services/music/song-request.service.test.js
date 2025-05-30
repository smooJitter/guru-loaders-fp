import * as requestService from './song-request.service.js';
import { ValidationError, NotFoundError, InsufficientCreditsError } from '../../lib/errors.js';

describe('Song Request Service', () => {
  let mockContext;
  let mockRequest;
  let mockSong;
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: 'user123',
      username: 'testuser'
    };

    mockSong = {
      _id: 'song123',
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Rock'
    };

    mockRequest = {
      _id: 'request123',
      userId: 'user123',
      songId: 'song123',
      status: 'pending',
      creditsSpent: 1,
      requestedAt: new Date(),
      metadata: {
        swipeId: 'swipe123',
        requestSource: 'swipe',
        location: 'venue1',
        event: 'event1'
      }
    };

    mockContext = {
      services: {
        db: {
          Song: {
            findById: jest.fn()
          },
          SongRequest: {
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
            countDocuments: jest.fn(),
            aggregate: jest.fn()
          }
        },
        credits: {
          getUserCredits: jest.fn(),
          deductCredits: jest.fn(),
          addCredits: jest.fn()
        },
        events: {
          emit: jest.fn()
        }
      }
    };
  });

  describe('createRequestFromSwipe', () => {
    it('should create a request successfully', async () => {
      mockContext.services.credits.getUserCredits.mockResolvedValue(5);
      mockContext.services.db.Song.findById.mockResolvedValue(mockSong);
      mockContext.services.db.SongRequest.findOne.mockResolvedValue(null);
      mockContext.services.db.SongRequest.create.mockResolvedValue(mockRequest);

      const result = await requestService.createRequestFromSwipe(mockContext, {
        userId: 'user123',
        songId: 'song123',
        swipeId: 'swipe123',
        location: 'venue1',
        event: 'event1'
      });

      expect(result).toEqual(mockRequest);
      expect(mockContext.services.credits.deductCredits).toHaveBeenCalledWith(
        'user123',
        1,
        expect.any(Object)
      );
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.requested',
        expect.any(Object)
      );
    });

    it('should throw error for insufficient credits', async () => {
      mockContext.services.credits.getUserCredits.mockResolvedValue(0);

      await expect(requestService.createRequestFromSwipe(mockContext, {
        userId: 'user123',
        songId: 'song123'
      })).rejects.toThrow(InsufficientCreditsError);
    });

    it('should throw error for non-existent song', async () => {
      mockContext.services.credits.getUserCredits.mockResolvedValue(5);
      mockContext.services.db.Song.findById.mockResolvedValue(null);

      await expect(requestService.createRequestFromSwipe(mockContext, {
        userId: 'user123',
        songId: 'nonexistent'
      })).rejects.toThrow(NotFoundError);
    });

    it('should throw error for duplicate request', async () => {
      mockContext.services.credits.getUserCredits.mockResolvedValue(5);
      mockContext.services.db.Song.findById.mockResolvedValue(mockSong);
      mockContext.services.db.SongRequest.findOne.mockResolvedValue(mockRequest);

      await expect(requestService.createRequestFromSwipe(mockContext, {
        userId: 'user123',
        songId: 'song123'
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('getPendingRequests', () => {
    it('should return paginated pending requests', async () => {
      const requests = [mockRequest];
      mockContext.services.db.SongRequest.getPendingRequests.mockResolvedValue(requests);
      mockContext.services.db.SongRequest.countDocuments.mockResolvedValue(1);

      const result = await requestService.getPendingRequests(mockContext, {
        page: 1,
        limit: 20
      });

      expect(result.requests).toEqual(requests);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getUserRequests', () => {
    it('should return user requests with pagination', async () => {
      const requests = [mockRequest];
      mockContext.services.db.SongRequest.find.mockResolvedValue(requests);
      mockContext.services.db.SongRequest.countDocuments.mockResolvedValue(1);

      const result = await requestService.getUserRequests(mockContext, 'user123', {
        page: 1,
        limit: 20
      });

      expect(result.requests).toEqual(requests);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply status filter', async () => {
      await requestService.getUserRequests(mockContext, 'user123', {
        status: 'pending'
      });

      expect(mockContext.services.db.SongRequest.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          status: 'pending'
        })
      );
    });
  });

  describe('approveRequest', () => {
    it('should approve a pending request', async () => {
      const approvedRequest = { ...mockRequest, status: 'approved' };
      mockContext.services.db.SongRequest.findById.mockResolvedValue(mockRequest);
      mockRequest.approve = jest.fn().mockResolvedValue(approvedRequest);

      const result = await requestService.approveRequest(mockContext, 'request123');

      expect(result.status).toBe('approved');
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.request.approved',
        expect.any(Object)
      );
    });

    it('should throw error for non-existent request', async () => {
      mockContext.services.db.SongRequest.findById.mockResolvedValue(null);

      await expect(requestService.approveRequest(mockContext, 'nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw error for non-pending request', async () => {
      const nonPendingRequest = { ...mockRequest, status: 'approved' };
      mockContext.services.db.SongRequest.findById.mockResolvedValue(nonPendingRequest);

      await expect(requestService.approveRequest(mockContext, 'request123'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending request and refund credits', async () => {
      const rejectedRequest = { ...mockRequest, status: 'rejected' };
      mockContext.services.db.SongRequest.findById.mockResolvedValue(mockRequest);
      mockRequest.reject = jest.fn().mockResolvedValue(rejectedRequest);

      const result = await requestService.rejectRequest(
        mockContext,
        'request123',
        'Not appropriate'
      );

      expect(result.status).toBe('rejected');
      expect(mockContext.services.credits.addCredits).toHaveBeenCalledWith(
        'user123',
        1,
        expect.any(Object)
      );
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.request.rejected',
        expect.any(Object)
      );
    });
  });

  describe('markRequestAsPlayed', () => {
    it('should mark an approved request as played', async () => {
      const approvedRequest = { ...mockRequest, status: 'approved' };
      const playedRequest = { ...approvedRequest, status: 'played' };
      mockContext.services.db.SongRequest.findById.mockResolvedValue(approvedRequest);
      approvedRequest.markAsPlayed = jest.fn().mockResolvedValue(playedRequest);

      const result = await requestService.markRequestAsPlayed(mockContext, 'request123');

      expect(result.status).toBe('played');
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.request.played',
        expect.any(Object)
      );
    });
  });

  describe('getRequestStats', () => {
    it('should return request statistics', async () => {
      const mockStats = [
        { _id: 'pending', count: 2, creditsSpent: 2 },
        { _id: 'approved', count: 3, creditsSpent: 3 },
        { _id: 'rejected', count: 1, creditsSpent: 1 }
      ];
      mockContext.services.db.SongRequest.aggregate.mockResolvedValue(mockStats);

      const result = await requestService.getRequestStats(mockContext, 'user123');

      expect(result).toEqual({
        total: 6,
        pending: 2,
        approved: 3,
        rejected: 1,
        played: 0,
        totalCreditsSpent: 6
      });
    });
  });
}); 