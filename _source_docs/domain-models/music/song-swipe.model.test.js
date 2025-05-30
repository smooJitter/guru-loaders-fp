import mongoose from 'mongoose';
import SongSwipe from './song-swipe.model.js';

describe('SongSwipe Model', () => {
  // Mock data
  const mockUserId = new mongoose.Types.ObjectId();
  const mockSongId = new mongoose.Types.ObjectId();
  
  const validSwipeData = {
    userId: mockUserId,
    songId: mockSongId,
    action: 'like',
    interaction: {
      timestamp: new Date(),
      duration: 30,
      position: 15,
      context: 'discovery'
    },
    feedback: {
      reason: 'Great beat',
      mood: 'Happy',
      genre: 'Pop'
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should create a swipe with valid data', async () => {
      const swipe = new SongSwipe(validSwipeData);
      const savedSwipe = await swipe.save();
      
      expect(savedSwipe.userId.toString()).toBe(mockUserId.toString());
      expect(savedSwipe.songId.toString()).toBe(mockSongId.toString());
      expect(savedSwipe.action).toBe('like');
      expect(savedSwipe.interaction.context).toBe('discovery');
      expect(savedSwipe.status).toBe('active');
    });

    it('should create a swipe with minimal data', async () => {
      const minimalData = {
        userId: mockUserId,
        songId: mockSongId,
        action: 'skip'
      };
      
      const swipe = new SongSwipe(minimalData);
      const savedSwipe = await swipe.save();
      
      expect(savedSwipe.action).toBe('skip');
      expect(savedSwipe.interaction.timestamp).toBeDefined();
      expect(savedSwipe.feedback).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle swipe without feedback', async () => {
      const swipeData = { ...validSwipeData };
      delete swipeData.feedback;
      
      const swipe = new SongSwipe(swipeData);
      const savedSwipe = await swipe.save();
      
      expect(savedSwipe.feedback).toBeUndefined();
    });

    it('should handle swipe without interaction duration', async () => {
      const swipeData = { ...validSwipeData };
      delete swipeData.interaction.duration;
      
      const swipe = new SongSwipe(swipeData);
      const savedSwipe = await swipe.save();
      
      expect(savedSwipe.interaction.duration).toBeUndefined();
    });

    it('should handle status transition to deleted', async () => {
      const swipe = new SongSwipe(validSwipeData);
      await swipe.save();
      
      swipe.status = 'deleted';
      const savedSwipe = await swipe.save();
      
      expect(savedSwipe.status).toBe('deleted');
    });
  });

  describe('Validation Failures', () => {
    it('should fail without required fields', async () => {
      const swipe = new SongSwipe({});
      
      await expect(swipe.save()).rejects.toThrow();
    });

    it('should fail with invalid action', async () => {
      const swipeData = {
        ...validSwipeData,
        action: 'invalid'
      };
      
      const swipe = new SongSwipe(swipeData);
      
      await expect(swipe.save()).rejects.toThrow();
    });

    it('should fail with duplicate user-song combination', async () => {
      const swipe1 = new SongSwipe(validSwipeData);
      await swipe1.save();
      
      const swipe2 = new SongSwipe(validSwipeData);
      
      await expect(swipe2.save()).rejects.toThrow('User has already swiped on this song');
    });
  });

  describe('Status Transitions', () => {
    it('should allow valid status transitions', async () => {
      const swipe = new SongSwipe(validSwipeData);
      await swipe.save();
      
      swipe.status = 'deleted';
      await swipe.save();
      
      expect(swipe.status).toBe('deleted');
    });

    it('should fail with invalid status', async () => {
      const swipe = new SongSwipe(validSwipeData);
      await swipe.save();
      
      swipe.status = 'invalid';
      
      await expect(swipe.save()).rejects.toThrow();
    });
  });

  describe('Interaction Context', () => {
    it('should accept valid interaction contexts', async () => {
      const contexts = ['discovery', 'playlist', 'radio'];
      
      for (const context of contexts) {
        const swipeData = {
          ...validSwipeData,
          interaction: { ...validSwipeData.interaction, context }
        };
        
        const swipe = new SongSwipe(swipeData);
        const savedSwipe = await swipe.save();
        
        expect(savedSwipe.interaction.context).toBe(context);
      }
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude version key in JSON output', async () => {
      const swipe = new SongSwipe(validSwipeData);
      await swipe.save();
      
      const json = swipe.toJSON();
      
      expect(json.__v).toBeUndefined();
    });
  });
}); 