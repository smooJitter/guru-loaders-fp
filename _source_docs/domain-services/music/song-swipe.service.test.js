import * as swipeService from './song-swipe.service.js';
import { ValidationError, NotFoundError } from '../../lib/errors.js';

describe('Song Swipe Service', () => {
  let mockContext;
  let mockSwipe;
  let mockSong;

  beforeEach(() => {
    mockSong = {
      _id: 'song123',
      title: 'Test Song',
      artist: 'Test Artist',
      genre: 'Rock'
    };

    mockSwipe = {
      _id: 'swipe123',
      userId: 'user123',
      songId: 'song123',
      direction: 'right',
      reason: 'Liked the beat',
      timestamp: new Date()
    };

    mockContext = {
      services: {
        db: {
          Song: {
            findById: jest.fn(),
            aggregate: jest.fn()
          },
          SongSwipe: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            aggregate: jest.fn()
          }
        },
        events: {
          emit: jest.fn()
        }
      }
    };
  });

  describe('createSwipe', () => {
    it('should create a swipe successfully', async () => {
      mockContext.services.db.Song.findById.mockResolvedValue(mockSong);
      mockContext.services.db.SongSwipe.create.mockResolvedValue(mockSwipe);

      const result = await swipeService.createSwipe(mockContext, {
        userId: 'user123',
        songId: 'song123',
        direction: 'right',
        reason: 'Liked the beat'
      });

      expect(result).toEqual(mockSwipe);
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.swiped',
        expect.objectContaining({
          userId: 'user123',
          songId: 'song123',
          direction: 'right'
        })
      );
    });

    it('should throw validation error for missing required fields', async () => {
      await expect(swipeService.createSwipe(mockContext, {}))
        .rejects.toThrow(ValidationError);
    });

    it('should throw validation error for invalid direction', async () => {
      await expect(swipeService.createSwipe(mockContext, {
        userId: 'user123',
        songId: 'song123',
        direction: 'up'
      })).rejects.toThrow(ValidationError);
    });

    it('should throw not found error for non-existent song', async () => {
      mockContext.services.db.Song.findById.mockResolvedValue(null);

      await expect(swipeService.createSwipe(mockContext, {
        userId: 'user123',
        songId: 'nonexistent',
        direction: 'right'
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSwipeHistory', () => {
    it('should return paginated swipe history', async () => {
      const swipes = [mockSwipe];
      mockContext.services.db.SongSwipe.find.mockResolvedValue(swipes);
      mockContext.services.db.SongSwipe.countDocuments.mockResolvedValue(1);

      const result = await swipeService.getSwipeHistory(mockContext, 'user123', {
        page: 1,
        limit: 20
      });

      expect(result.swipes).toEqual(swipes);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply filters correctly', async () => {
      await swipeService.getSwipeHistory(mockContext, 'user123', {
        direction: 'right',
        startDate: '2024-03-01',
        endDate: '2024-03-31'
      });

      expect(mockContext.services.db.SongSwipe.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          direction: 'right',
          timestamp: expect.any(Object)
        })
      );
    });
  });

  describe('getSwipeStats', () => {
    it('should return swipe statistics', async () => {
      const mockStats = [
        { _id: 'right', count: 5, songs: ['song1', 'song2'] },
        { _id: 'left', count: 3, songs: ['song3'] }
      ];
      mockContext.services.db.SongSwipe.aggregate.mockResolvedValue(mockStats);

      const result = await swipeService.getSwipeStats(mockContext, 'user123');

      expect(result).toEqual({
        total: 8,
        left: 3,
        right: 5,
        uniqueSongs: 3
      });
    });
  });

  describe('getSongSwipeAnalytics', () => {
    it('should return song swipe analytics', async () => {
      const mockAnalytics = [
        { _id: 'right', count: 10, uniqueUsers: ['user1', 'user2'] },
        { _id: 'left', count: 5, uniqueUsers: ['user3'] }
      ];
      mockContext.services.db.SongSwipe.aggregate.mockResolvedValue(mockAnalytics);

      const result = await swipeService.getSongSwipeAnalytics(mockContext, 'song123');

      expect(result).toEqual({
        total: 15,
        left: 5,
        right: 10,
        uniqueUsers: 3,
        matchRate: 66.67
      });
    });
  });

  describe('getSwipeRecommendations', () => {
    it('should return song recommendations based on swipe history', async () => {
      const mockSwipes = [
        { songId: 'song1', direction: 'right' },
        { songId: 'song2', direction: 'right' },
        { songId: 'song3', direction: 'left' }
      ];
      mockContext.services.db.SongSwipe.find.mockResolvedValue(mockSwipes);

      const mockGenreStats = [
        { _id: 'Rock', count: 2 },
        { _id: 'Pop', count: 1 }
      ];
      mockContext.services.db.Song.aggregate
        .mockResolvedValueOnce(mockGenreStats)
        .mockResolvedValueOnce([
          {
            _id: 'song4',
            title: 'Recommended Song',
            artist: { name: 'Artist' },
            genre: 'Rock',
            playCount: 100
          }
        ]);

      const result = await swipeService.getSwipeRecommendations(mockContext, 'user123');

      expect(result).toHaveLength(1);
      expect(result[0].genre).toBe('Rock');
    });
  });

  describe('getUserSwipeMatches', () => {
    it('should return matching songs between two users', async () => {
      const mockUserSwipes = [
        { songId: 'song1' },
        { songId: 'song2' }
      ];
      const mockOtherUserSwipes = [
        { songId: 'song2' },
        { songId: 'song3' }
      ];
      const mockMatches = [
        {
          _id: 'song2',
          title: 'Matching Song',
          artist: { name: 'Artist' },
          album: { title: 'Album' }
        }
      ];

      mockContext.services.db.SongSwipe.find
        .mockResolvedValueOnce(mockUserSwipes)
        .mockResolvedValueOnce(mockOtherUserSwipes);
      mockContext.services.db.Song.find.mockResolvedValue(mockMatches);

      const result = await swipeService.getUserSwipeMatches(
        mockContext,
        'user123',
        'user456'
      );

      expect(result).toEqual(mockMatches);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('song2');
    });
  });

  describe('getUserSwipeCompatibility', () => {
    it('should return compatibility metrics between users', async () => {
      const mockUserStats = {
        total: 10,
        right: 7,
        left: 3,
        uniqueSongs: 10
      };
      const mockOtherUserStats = {
        total: 8,
        right: 5,
        left: 3,
        uniqueSongs: 8
      };
      const mockMatches = [
        { _id: 'song1', title: 'Matching Song 1' },
        { _id: 'song2', title: 'Matching Song 2' }
      ];

      jest.spyOn(swipeService, 'getSwipeStats')
        .mockResolvedValueOnce(mockUserStats)
        .mockResolvedValueOnce(mockOtherUserStats);
      jest.spyOn(swipeService, 'getUserSwipeMatches')
        .mockResolvedValue(mockMatches);

      const result = await swipeService.getUserSwipeCompatibility(
        mockContext,
        'user123',
        'user456'
      );

      expect(result).toEqual({
        matchCount: 2,
        matchPercentage: expect.any(Number),
        userStats: {
          totalSwipes: 10,
          rightSwipes: 7,
          leftSwipes: 3
        },
        otherUserStats: {
          totalSwipes: 8,
          rightSwipes: 5,
          leftSwipes: 3
        },
        matchingSongs: mockMatches
      });
    });
  });

  describe('getUserSwipePreferences', () => {
    it('should return user preferences based on right swipes', async () => {
      const mockRightSwipes = [
        {
          songId: {
            _id: 'song1',
            genre: 'Rock',
            artist: { _id: 'artist1', name: 'Artist 1' },
            album: { _id: 'album1', title: 'Album 1' }
          }
        },
        {
          songId: {
            _id: 'song2',
            genre: 'Rock',
            artist: { _id: 'artist1', name: 'Artist 1' },
            album: { _id: 'album2', title: 'Album 2' }
          }
        },
        {
          songId: {
            _id: 'song3',
            genre: 'Pop',
            artist: { _id: 'artist2', name: 'Artist 2' },
            album: { _id: 'album3', title: 'Album 3' }
          }
        }
      ];

      mockContext.services.db.SongSwipe.find.mockResolvedValue(mockRightSwipes);

      const result = await swipeService.getUserSwipePreferences(
        mockContext,
        'user123'
      );

      expect(result).toEqual({
        genres: { Rock: 2, Pop: 1 },
        artists: { artist1: 2, artist2: 1 },
        albums: { album1: 1, album2: 1, album3: 1 },
        totalLikes: 3,
        topGenres: [
          { genre: 'Rock', count: 2 },
          { genre: 'Pop', count: 1 }
        ],
        topArtists: [
          { artistId: 'artist1', count: 2 },
          { artistId: 'artist2', count: 1 }
        ],
        topAlbums: [
          { albumId: 'album1', count: 1 },
          { albumId: 'album2', count: 1 },
          { albumId: 'album3', count: 1 }
        ]
      });
    });
  });

  describe('getSimilarUsers', () => {
    it('should return users with similar swipe preferences', async () => {
      const mockAllUsers = ['user456', 'user789'];
      const mockUserPreferences = {
        topGenres: [
          { genre: 'Rock', count: 5 },
          { genre: 'Pop', count: 3 }
        ],
        genres: { Rock: 5, Pop: 3 }
      };
      const mockOtherPreferences = {
        topGenres: [
          { genre: 'Rock', count: 4 },
          { genre: 'Pop', count: 2 }
        ],
        genres: { Rock: 4, Pop: 2 }
      };
      const mockCompatibility = {
        matchCount: 3,
        matchPercentage: 60
      };

      mockContext.services.db.SongSwipe.distinct.mockResolvedValue(mockAllUsers);
      jest.spyOn(swipeService, 'getUserSwipePreferences')
        .mockResolvedValueOnce(mockUserPreferences)
        .mockResolvedValueOnce(mockOtherPreferences);
      jest.spyOn(swipeService, 'getUserSwipeCompatibility')
        .mockResolvedValue(mockCompatibility);

      const result = await swipeService.getSimilarUsers(
        mockContext,
        'user123',
        { limit: 5 }
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: 'user456',
        similarityScore: expect.any(Number),
        matchCount: 3,
        matchPercentage: 60,
        genreSimilarity: expect.any(Number)
      });
    });
  });
}); 