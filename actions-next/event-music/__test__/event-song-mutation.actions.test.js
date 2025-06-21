// Tests for event-song mutation actions
import {
  addRating,
  createSong,
  updateSong,
  updateSongStatus,
  deleteSong,
  incrementPlayCount,
  bulkDeleteSongs,
  restoreSong
} from '../song/event-song-mutation.actions.js';
import { ERRORS } from '../song/event-song-mutation.actions.js';

describe('event-song mutation actions', () => {
  let mockContext;
  let mockSong;

  beforeEach(() => {
    mockSong = { _id: 'song1', title: 'Test', artist: 'artist1', ratings: [], playCount: 0 };
    const leanExec = () => {
      const songWithExec = { ...mockSong, exec: () => mockSong };
      return {
        lean: () => songWithExec,
        exec: () => mockSong
      };
    };
    mockContext = {
      models: {
        Song: {
          findById: jest.fn(() => mockSong),
          findByIdAndUpdate: jest.fn(() => leanExec()),
          findByIdAndDelete: jest.fn(() => leanExec()),
          create: jest.fn(() => mockSong),
          updateOne: jest.fn(() => ({ nModified: 1 })),
          find: jest.fn(() => [mockSong]),
          updateMany: jest.fn(() => ({ nModified: 2 })),
          restore: jest.fn(() => ({ success: true, id: 'song1' }))
        }
      },
      services: { events: { emit: jest.fn() } }
    };
  });

  describe('addRating', () => {
    it('should add a rating (happy path)', async () => {
      const input = {
        context: mockContext,
        id: 'song1',
        rating: { userId: 'user1', value: 5 }
      };
      const result = await addRating(input);
      expect(result).toHaveProperty('_id', 'song1');
    });

    it('should fail if required fields are missing', async () => {
      const input = { context: mockContext, id: 'song1', rating: { value: 5 } };
      await expect(addRating(input)).rejects.toThrow('rating.userId is a required field');
    });

    it('should fail if rating value is invalid', async () => {
      const input = { context: mockContext, id: 'song1', rating: { userId: 'user1', value: 10 } };
      await expect(addRating(input)).rejects.toThrow('rating.value must be less than or equal to 5');
    });

    it('should throw if song not found', async () => {
      mockContext.models.Song.findByIdAndUpdate.mockReturnValue({ lean: () => null });
      const input = { context: mockContext, id: 'song1', rating: { userId: 'user1', value: 5 } };
      await expect(addRating(input)).rejects.toThrow('Song not found with id: song1');
    });

    it('should work if events service is missing', async () => {
      const input = { context: { ...mockContext, services: {} }, id: 'song1', rating: { userId: 'user1', value: 5 } };
      const result = await addRating(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
  });

  describe('createSong', () => {
    it('should create a song (happy path)', async () => {
      const input = {
        context: mockContext,
        title: 'Test',
        artist: 'artist1',
        audioFile: { url: 'url', duration: 100, format: 'mp3', size: 1000 }
      };
      const result = await createSong(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
    it('should fail if required fields are missing', async () => {
      const input = { context: mockContext, artist: 'artist1', audioFile: { url: 'url', duration: 100, format: 'mp3', size: 1000 } };
      await expect(createSong(input)).rejects.toThrow('title is a required field');
    });
    it('should work if events service is missing', async () => {
      const input = {
        context: { ...mockContext, services: {} },
        title: 'Test',
        artist: 'artist1',
        audioFile: { url: 'url', duration: 100, format: 'mp3', size: 1000 }
      };
      const result = await createSong(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
    it('should work if song has no toObject method', async () => {
      mockContext.models.Song.create.mockReturnValue({ _id: 'song1', title: 'Test', artist: 'artist1' });
      const input = {
        context: mockContext,
        title: 'Test',
        artist: 'artist1',
        audioFile: { url: 'url', duration: 100, format: 'mp3', size: 1000 }
      };
      const result = await createSong(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
  });

  describe('updateSong', () => {
    it('should update a song (happy path)', async () => {
      const input = { context: mockContext, id: 'song1', update: { title: 'New' } };
      const result = await updateSong(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
    it('should fail if id is missing', async () => {
      const input = { context: mockContext, update: { title: 'New' } };
      await expect(updateSong(input)).rejects.toThrow('id is a required field');
    });
    it('should fail if update is missing', async () => {
      const input = { context: mockContext, id: 'song1' };
      await expect(updateSong(input)).rejects.toThrow('update is a required field');
    });
    it('should return null if song not found', async () => {
      mockContext.models.Song.findByIdAndUpdate.mockReturnValue({ lean: () => ({ exec: () => null }) });
      const input = { context: mockContext, id: 'song1', update: { title: 'New' } };
      const result = await updateSong(input);
      expect(result).toBeNull();
    });
  });

  describe('updateSongStatus', () => {
    it('should update song status (happy path)', async () => {
      const input = { context: mockContext, id: 'song1', status: 'active' };
      const result = await updateSongStatus(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
    it('should fail if status is invalid', async () => {
      const input = { context: mockContext, id: 'song1', status: 'not-a-status' };
      await expect(updateSongStatus(input)).rejects.toThrow('Invalid status');
    });
    it('should fail if id is missing', async () => {
      const input = { context: mockContext, status: 'active' };
      await expect(updateSongStatus(input)).rejects.toThrow('id is a required field');
    });
    it('should throw if song not found', async () => {
      mockContext.models.Song.findByIdAndUpdate.mockReturnValue({ lean: () => null });
      const input = { context: mockContext, id: 'song1', status: 'active' };
      await expect(updateSongStatus(input)).rejects.toThrow('Song not found with id: song1');
    });
    it('should work if events service is missing', async () => {
      const input = { context: { ...mockContext, services: {} }, id: 'song1', status: 'active' };
      const result = await updateSongStatus(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
  });

  describe('deleteSong', () => {
    it('should delete a song (happy path)', async () => {
      const input = { context: mockContext, id: 'song1' };
      const result = await deleteSong(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
    it('should fail if id is missing', async () => {
      const input = { context: mockContext };
      await expect(deleteSong(input)).rejects.toThrow('id is a required field');
    });
  });

  describe('incrementPlayCount', () => {
    it('should increment play count (happy path)', async () => {
      const input = { context: mockContext, id: 'song1' };
      const result = await incrementPlayCount(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
    it('should fail if id is missing', async () => {
      const input = { context: mockContext };
      await expect(incrementPlayCount(input)).rejects.toThrow('id is a required field');
    });
    it('should throw if song not found', async () => {
      mockContext.models.Song.findByIdAndUpdate.mockReturnValue({ lean: () => null });
      const input = { context: mockContext, id: 'song1' };
      await expect(incrementPlayCount(input)).rejects.toThrow('Song not found with id: song1');
    });
    it('should work if events service is missing', async () => {
      const input = { context: { ...mockContext, services: {} }, id: 'song1' };
      const result = await incrementPlayCount(input);
      expect(result).toHaveProperty('_id', 'song1');
    });
  });

  describe('bulkDeleteSongs', () => {
    it('should bulk delete songs (happy path)', async () => {
      const input = { context: mockContext, ids: ['song1', 'song2'] };
      const result = await bulkDeleteSongs(input);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count', 2);
    });
    it('should fail if ids are missing', async () => {
      const input = { context: mockContext };
      await expect(bulkDeleteSongs(input)).rejects.toThrow('ids is a required field');
    });
  });

  describe('restoreSong', () => {
    it('should restore a song (happy path)', async () => {
      const input = { context: mockContext, id: 'song1' };
      const result = await restoreSong(input);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('id', 'song1');
    });
    it('should fail if id is missing', async () => {
      const input = { context: mockContext };
      await expect(restoreSong(input)).rejects.toThrow('id is a required field');
    });
  });
}); 