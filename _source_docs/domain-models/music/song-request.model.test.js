import mongoose from 'mongoose';
import SongRequest from './song-request.model.js';

describe('Song Request Model', () => {
  let mockRequest;
  let mockUser;
  let mockSong;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await SongRequest.deleteMany({});

    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser'
    };

    mockSong = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Rock'
    };

    mockRequest = {
      userId: mockUser._id,
      songId: mockSong._id,
      status: 'pending',
      creditsSpent: 1,
      requestedAt: new Date(),
      metadata: {
        swipeId: new mongoose.Types.ObjectId(),
        requestSource: 'swipe',
        location: 'venue1',
        event: 'event1'
      }
    };
  });

  describe('Schema Validation', () => {
    it('should create a valid request', async () => {
      const request = new SongRequest(mockRequest);
      const savedRequest = await request.save();

      expect(savedRequest._id).toBeDefined();
      expect(savedRequest.status).toBe('pending');
      expect(savedRequest.creditsSpent).toBe(1);
      expect(savedRequest.metadata.requestSource).toBe('swipe');
    });

    it('should require userId and songId', async () => {
      const request = new SongRequest({
        status: 'pending',
        creditsSpent: 1
      });

      await expect(request.save()).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const request = new SongRequest({
        ...mockRequest,
        status: 'invalid_status'
      });

      await expect(request.save()).rejects.toThrow();
    });

    it('should validate requestSource enum', async () => {
      const request = new SongRequest({
        ...mockRequest,
        metadata: {
          ...mockRequest.metadata,
          requestSource: 'invalid_source'
        }
      });

      await expect(request.save()).rejects.toThrow();
    });
  });

  describe('Model Methods', () => {
    it('should approve a request', async () => {
      const request = await SongRequest.create(mockRequest);
      await request.approve();

      const updatedRequest = await SongRequest.findById(request._id);
      expect(updatedRequest.status).toBe('approved');
    });

    it('should reject a request with reason', async () => {
      const request = await SongRequest.create(mockRequest);
      const reason = 'Not appropriate';
      await request.reject(reason);

      const updatedRequest = await SongRequest.findById(request._id);
      expect(updatedRequest.status).toBe('rejected');
      expect(updatedRequest.rejectionReason).toBe(reason);
    });

    it('should mark a request as played', async () => {
      const request = await SongRequest.create({
        ...mockRequest,
        status: 'approved'
      });
      await request.markAsPlayed();

      const updatedRequest = await SongRequest.findById(request._id);
      expect(updatedRequest.status).toBe('played');
      expect(updatedRequest.playedAt).toBeDefined();
    });
  });

  describe('Model Statics', () => {
    beforeEach(async () => {
      // Create multiple requests for testing
      await SongRequest.create([
        { ...mockRequest, status: 'pending' },
        { ...mockRequest, status: 'pending' },
        { ...mockRequest, status: 'approved' },
        { ...mockRequest, status: 'rejected' }
      ]);
    });

    it('should get pending requests with limit', async () => {
      const requests = await SongRequest.getPendingRequests(2);
      expect(requests).toHaveLength(2);
      expect(requests[0].status).toBe('pending');
    });

    it('should get user requests with status filter', async () => {
      const requests = await SongRequest.getUserRequests(mockUser._id, 'pending');
      expect(requests).toHaveLength(2);
      expect(requests[0].status).toBe('pending');
    });

    it('should get all user requests without status filter', async () => {
      const requests = await SongRequest.getUserRequests(mockUser._id);
      expect(requests).toHaveLength(4);
    });
  });

  describe('Virtuals', () => {
    it('should calculate request age', async () => {
      const request = await SongRequest.create(mockRequest);
      expect(request.age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Indexes', () => {
    it('should have compound index on status and requestedAt', async () => {
      const indexes = await SongRequest.collection.indexes();
      const statusRequestedAtIndex = indexes.find(
        index => 
          index.key.status === 1 && 
          index.key.requestedAt === 1
      );
      expect(statusRequestedAtIndex).toBeDefined();
    });

    it('should have compound index on userId and status', async () => {
      const indexes = await SongRequest.collection.indexes();
      const userIdStatusIndex = indexes.find(
        index => 
          index.key.userId === 1 && 
          index.key.status === 1
      );
      expect(userIdStatusIndex).toBeDefined();
    });
  });
}); 