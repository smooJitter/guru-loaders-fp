import * as eventSongRequestActionsModule from '../song-request/event-song-request-mutation.actions.js';
const actionsArr = eventSongRequestActionsModule.default || eventSongRequestActionsModule;
const actions = Object.fromEntries(actionsArr.map(a => [a.name, a]));

import {
  createRequestFromSwipe,
  approveRequest,
  rejectRequest,
  markRequestAsPlayed,
  bulkApproveRequests,
  bulkRejectRequests
} from '../song-request/event-song-request-mutation.actions.js';

describe('event-song-request mutation actions', () => {
  let mockContext;
  let mockRequest;
  let mockSong;

  beforeEach(() => {
    mockRequest = { _id: 'req1', userId: 'user1', songId: 'song1', status: 'pending', creditsSpent: 1 };
    mockSong = { _id: 'song1', title: 'Test', artist: 'artist1' };
    mockContext = {
      models: {
        Song: { findById: jest.fn(() => mockSong) },
        SongRequest: {
          findOne: jest.fn(() => null),
          create: jest.fn(() => mockRequest),
          findById: jest.fn(() => ({
            ...mockRequest,
            approve: jest.fn(),
            reject: jest.fn(),
            markAsPlayed: jest.fn(),
          })),
          updateMany: jest.fn(() => ({ nModified: 2 })),
        }
      },
      services: {
        creditsService: {
          getUserCredits: jest.fn(() => 10),
          deductCredits: jest.fn(),
          addCredits: jest.fn()
        },
        events: { emit: jest.fn() }
      }
    };
  });

  describe('createRequestFromSwipe', () => {
    it('should create a request (happy path)', async () => {
      const input = {
        context: mockContext,
        userId: 'user1',
        songId: 'song1',
        swipeId: 'swipe1',
        location: 'venue',
        event: 'event1',
        creditsSpent: 1
      };
      const result = await createRequestFromSwipe(input);
      expect(result).toHaveProperty('_id', 'req1');
    });
    it('should fail if required fields are missing', async () => {
      const input = { context: mockContext, userId: 'user1', creditsSpent: 1 };
      await expect(createRequestFromSwipe(input)).rejects.toThrow('songId is a required field');
    });
    it('should fail if duplicate request exists', async () => {
      mockContext.models.SongRequest.findOne = jest.fn(() => mockRequest);
      const input = {
        context: mockContext,
        userId: 'user1',
        songId: 'song1',
        swipeId: 'swipe1',
        location: 'venue',
        event: 'event1'
      };
      await expect(createRequestFromSwipe(input)).rejects.toThrow('You already have a pending request');
    });
  });

  describe('approveRequest', () => {
    it('should approve a request (happy path)', async () => {
      const input = { context: mockContext, requestId: 'req1' };
      mockContext.models.SongRequest.findById = jest.fn(() => ({ ...mockRequest, status: 'pending', approve: jest.fn() }));
      const result = await approveRequest(input);
      expect(result).toHaveProperty('_id', 'req1');
    });
    it('should fail if requestId is missing', async () => {
      const input = { context: mockContext };
      await expect(approveRequest(input)).rejects.toThrow('requestId is a required field');
    });
    it('should fail if status is not pending', async () => {
      mockContext.models.SongRequest.findById = jest.fn(() => ({ ...mockRequest, status: 'approved', approve: jest.fn() }));
      const input = { context: mockContext, requestId: 'req1' };
      await expect(approveRequest(input)).rejects.toThrow('Invalid request status');
    });
  });

  describe('rejectRequest', () => {
    it('should reject a request (happy path)', async () => {
      const input = { context: mockContext, requestId: 'req1', reason: 'bad' };
      mockContext.models.SongRequest.findById = jest.fn(() => ({ ...mockRequest, status: 'pending', reject: jest.fn() }));
      const result = await rejectRequest(input);
      expect(result).toHaveProperty('_id', 'req1');
    });
    it('should fail if requestId is missing', async () => {
      const input = { context: mockContext };
      await expect(rejectRequest(input)).rejects.toThrow('requestId is a required field');
    });
    it('should fail if status is not pending', async () => {
      mockContext.models.SongRequest.findById = jest.fn(() => ({ ...mockRequest, status: 'approved', reject: jest.fn() }));
      const input = { context: mockContext, requestId: 'req1', reason: 'bad' };
      await expect(rejectRequest(input)).rejects.toThrow('Invalid request status');
    });
  });

  describe('markRequestAsPlayed', () => {
    it('should mark a request as played (happy path)', async () => {
      const input = { context: mockContext, requestId: 'req1' };
      mockContext.models.SongRequest.findById = jest.fn(() => ({ ...mockRequest, status: 'approved', markAsPlayed: jest.fn() }));
      const result = await markRequestAsPlayed(input);
      expect(result).toHaveProperty('_id', 'req1');
    });
    it('should fail if requestId is missing', async () => {
      const input = { context: mockContext };
      await expect(markRequestAsPlayed(input)).rejects.toThrow('requestId is a required field');
    });
    it('should fail if status is not approved', async () => {
      mockContext.models.SongRequest.findById = jest.fn(() => ({ ...mockRequest, status: 'pending', markAsPlayed: jest.fn() }));
      const input = { context: mockContext, requestId: 'req1' };
      await expect(markRequestAsPlayed(input)).rejects.toThrow('Invalid request status');
    });
  });

  describe('bulkApproveRequests', () => {
    it('should bulk approve requests (happy path)', async () => {
      const input = { context: mockContext, ids: ['req1', 'req2'] };
      const result = await bulkApproveRequests(input);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 2);
    });
    it('should fail if ids are missing', async () => {
      const input = { context: mockContext };
      await expect(bulkApproveRequests(input)).rejects.toThrow('ids is a required field');
    });
    it('returns success and count (future-proofed)', async () => {
      const context = mockContext;
      const { bulkApproveRequests } = actions;
      const result = await bulkApproveRequests.method({ context, ids: ['id1', 'id2'] });
      expect(result).toEqual({ success: true, count: 2 });
    });
    it('throws for missing context', async () => {
      const { bulkApproveRequests } = actions;
      await expect(bulkApproveRequests.method({ ids: ['id1'] })).rejects.toThrow();
    });
    it('throws for missing ids', async () => {
      const context = mockContext;
      const { bulkApproveRequests } = actions;
      await expect(bulkApproveRequests.method({ context })).rejects.toThrow();
    });
    it('throws for empty ids array', async () => {
      const context = mockContext;
      const { bulkApproveRequests } = actions;
      await expect(bulkApproveRequests.method({ context, ids: [] })).rejects.toThrow();
    });
  });

  describe('bulkRejectRequests', () => {
    it('should bulk reject requests (happy path)', async () => {
      const input = { context: mockContext, ids: ['req1', 'req2'] };
      const result = await bulkRejectRequests(input);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 2);
    });
    it('should fail if ids are missing', async () => {
      const input = { context: mockContext };
      await expect(bulkRejectRequests(input)).rejects.toThrow('ids is a required field');
    });
    it('returns success and count (future-proofed)', async () => {
      const context = mockContext;
      const { bulkRejectRequests } = actions;
      const result = await bulkRejectRequests.method({ context, ids: ['id1', 'id2'] });
      expect(result).toEqual({ success: true, count: 2 });
    });
    it('throws for missing context', async () => {
      const { bulkRejectRequests } = actions;
      await expect(bulkRejectRequests.method({ ids: ['id1'] })).rejects.toThrow();
    });
    it('throws for missing ids', async () => {
      const context = mockContext;
      const { bulkRejectRequests } = actions;
      await expect(bulkRejectRequests.method({ context })).rejects.toThrow();
    });
    it('throws for empty ids array', async () => {
      const context = mockContext;
      const { bulkRejectRequests } = actions;
      await expect(bulkRejectRequests.method({ context, ids: [] })).rejects.toThrow();
    });
  });
}); 