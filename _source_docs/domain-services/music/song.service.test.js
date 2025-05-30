import * as songService from './song.service.js';
import { ValidationError, NotFoundError } from '../../lib/errors.js';
import { SONG_STATUS, RATING_TYPES } from './config/constants.js';

describe('Song Service', () => {
  let mockContext;
  let mockSong;

  beforeEach(() => {
    mockSong = {
      _id: 'song123',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      genre: 'Rock',
      status: SONG_STATUS.ACTIVE,
      playCount: 0,
      ratings: []
    };

    mockContext = {
      services: {
        db: {
          Song: {
            create: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            countDocuments: jest.fn()
          }
        },
        events: {
          emit: jest.fn()
        }
      }
    };
  });

  describe('createSong', () => {
    it('should create a song successfully', async () => {
      mockContext.services.db.Song.create.mockResolvedValue(mockSong);

      const result = await songService.createSong(mockContext, {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        genre: 'Rock'
      });

      expect(result).toEqual(mockSong);
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.created',
        {
          songId: mockSong._id,
          title: mockSong.title,
          artist: mockSong.artist
        }
      );
    });

    it('should throw validation error for missing required fields', async () => {
      await expect(songService.createSong(mockContext, {}))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getSongById', () => {
    it('should return song by id', async () => {
      mockContext.services.db.Song.findById.mockResolvedValue(mockSong);

      const result = await songService.getSongById(mockContext, 'song123');

      expect(result).toEqual(mockSong);
    });

    it('should throw not found error for non-existent song', async () => {
      mockContext.services.db.Song.findById.mockResolvedValue(null);

      await expect(songService.getSongById(mockContext, 'nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('listSongs', () => {
    it('should return paginated list of songs', async () => {
      const songs = [mockSong];
      mockContext.services.db.Song.find.mockResolvedValue(songs);
      mockContext.services.db.Song.countDocuments.mockResolvedValue(1);

      const result = await songService.listSongs(mockContext, { page: 1, limit: 20 });

      expect(result.songs).toEqual(songs);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply filters correctly', async () => {
      await songService.listSongs(mockContext, { genre: 'Rock', artist: 'Test Artist' });

      expect(mockContext.services.db.Song.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: 'Rock',
          artist: 'Test Artist'
        })
      );
    });
  });

  describe('updateSong', () => {
    it('should update song successfully', async () => {
      const updatedSong = { ...mockSong, title: 'Updated Title' };
      mockContext.services.db.Song.findByIdAndUpdate.mockResolvedValue(updatedSong);

      const result = await songService.updateSong(mockContext, 'song123', { title: 'Updated Title' });

      expect(result).toEqual(updatedSong);
      expect(mockContext.services.events.emit).toHaveBeenCalledWith(
        'song.updated',
        {
          songId: mockSong._id,
          updates: { title: 'Updated Title' }
        }
      );
    });

    it('should throw not found error for non-existent song', async () => {
      mockContext.services.db.Song.findByIdAndUpdate.mockResolvedValue(null);

      await expect(songService.updateSong(mockContext, 'nonexistent', { title: 'New Title' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateSongStatus', () => {
    it('should update song status successfully', async () => {
      const updatedSong = { ...mockSong, status: SONG_STATUS.INACTIVE };
      mockContext.services.db.Song.findByIdAndUpdate.mockResolvedValue(updatedSong);

      const result = await songService.updateSongStatus(mockContext, 'song123', SONG_STATUS.INACTIVE);

      expect(result.status).toBe(SONG_STATUS.INACTIVE);
    });

    it('should throw validation error for invalid status', async () => {
      await expect(songService.updateSongStatus(mockContext, 'song123', 'invalid'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('incrementPlayCount', () => {
    it('should increment play count successfully', async () => {
      const updatedSong = { ...mockSong, playCount: 1, lastPlayedAt: new Date() };
      mockContext.services.db.Song.findByIdAndUpdate.mockResolvedValue(updatedSong);

      const result = await songService.incrementPlayCount(mockContext, 'song123');

      expect(result.playCount).toBe(1);
      expect(result.lastPlayedAt).toBeDefined();
    });
  });

  describe('addRating', () => {
    it('should add rating successfully', async () => {
      const rating = {
        userId: 'user123',
        value: 5,
        type: RATING_TYPES.USER
      };
      const updatedSong = {
        ...mockSong,
        ratings: [rating]
      };
      mockContext.services.db.Song.findByIdAndUpdate.mockResolvedValue(updatedSong);

      const result = await songService.addRating(mockContext, 'song123', rating);

      expect(result.ratings).toContainEqual(expect.objectContaining(rating));
    });

    it('should throw validation error for invalid rating', async () => {
      await expect(songService.addRating(mockContext, 'song123', { value: 6 }))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('searchSongs', () => {
    it('should search songs successfully', async () => {
      const songs = [mockSong];
      mockContext.services.db.Song.find.mockResolvedValue(songs);
      mockContext.services.db.Song.countDocuments.mockResolvedValue(1);

      const result = await songService.searchSongs(mockContext, 'Test');

      expect(result.songs).toEqual(songs);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search query correctly', async () => {
      await songService.searchSongs(mockContext, 'Rock');

      expect(mockContext.services.db.Song.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ genre: expect.any(Object) })
          ])
        })
      );
    });
  });

  describe('getSongAnalytics', () => {
    it('should return analytics grouped by day', async () => {
      const mockAnalytics = [
        {
          _id: '2024-03-19',
          totalSongs: 5,
          totalPlays: 100,
          avgRating: 4.5,
          genres: ['Rock', 'Pop']
        }
      ];
      mockContext.services.db.Song.aggregate = jest.fn().mockResolvedValue(mockAnalytics);

      const result = await songService.getSongAnalytics(mockContext, {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        groupBy: 'day'
      });

      expect(result).toEqual(mockAnalytics);
      expect(mockContext.services.db.Song.aggregate).toHaveBeenCalled();
    });
  });

  describe('getTopSongs', () => {
    it('should return top songs by play count', async () => {
      const mockTopSongs = [
        {
          _id: 'song123',
          title: 'Top Song',
          artist: { name: 'Artist' },
          playCount: 1000,
          avgRating: 4.5
        }
      ];
      mockContext.services.db.Song.aggregate = jest.fn().mockResolvedValue(mockTopSongs);

      const result = await songService.getTopSongs(mockContext, {
        limit: 10,
        timeRange: 'month',
        sortBy: 'playCount'
      });

      expect(result).toEqual(mockTopSongs);
      expect(mockContext.services.db.Song.aggregate).toHaveBeenCalled();
    });
  });

  describe('getGenreStats', () => {
    it('should return genre statistics', async () => {
      const mockStats = [
        {
          _id: 'Rock',
          count: 50,
          totalPlays: 5000,
          avgRating: 4.2
        }
      ];
      mockContext.services.db.Song.aggregate = jest.fn().mockResolvedValue(mockStats);

      const result = await songService.getGenreStats(mockContext);

      expect(result).toEqual(mockStats);
      expect(mockContext.services.db.Song.aggregate).toHaveBeenCalled();
    });
  });

  describe('getArtistMetrics', () => {
    it('should return artist performance metrics', async () => {
      const mockMetrics = {
        totalSongs: 10,
        totalPlays: 1000,
        avgRating: 4.5,
        genres: ['Rock', 'Pop'],
        totalDuration: 3600
      };
      mockContext.services.db.Song.aggregate = jest.fn().mockResolvedValue([mockMetrics]);

      const result = await songService.getArtistMetrics(mockContext, 'artist123');

      expect(result).toEqual(mockMetrics);
      expect(mockContext.services.db.Song.aggregate).toHaveBeenCalled();
    });

    it('should return default metrics for new artist', async () => {
      mockContext.services.db.Song.aggregate = jest.fn().mockResolvedValue([]);

      const result = await songService.getArtistMetrics(mockContext, 'newArtist123');

      expect(result).toEqual({
        totalSongs: 0,
        totalPlays: 0,
        avgRating: 0,
        genres: [],
        totalDuration: 0
      });
    });
  });

  describe('getTrendingSongs', () => {
    it('should return trending songs based on play velocity', async () => {
      const mockTrending = [
        {
          _id: 'song123',
          title: 'Trending Song',
          artist: { name: 'Artist' },
          playCount: 100,
          playVelocity: 14.28
        }
      ];
      mockContext.services.db.Song.aggregate = jest.fn().mockResolvedValue(mockTrending);

      const result = await songService.getTrendingSongs(mockContext, {
        limit: 10,
        timeWindow: 7
      });

      expect(result).toEqual(mockTrending);
      expect(mockContext.services.db.Song.aggregate).toHaveBeenCalled();
    });
  });
}); 