import mongoose from 'mongoose';
import Song from './song.model.js';

describe('Song Model', () => {
  // Mock data
  const mockArtistId = new mongoose.Types.ObjectId();
  const mockAlbumId = new mongoose.Types.ObjectId();
  
  const validSongData = {
    title: 'Test Song',
    artist: mockArtistId,
    album: mockAlbumId,
    audioFile: {
      url: 'https://example.com/song.mp3',
      duration: 180,
      format: 'mp3',
      size: 5000000,
      bitrate: 320,
      sampleRate: 44100
    },
    metadata: {
      genre: ['Pop', 'Rock'],
      year: 2024,
      bpm: 120,
      key: 'C',
      language: 'en',
      isExplicit: false,
      copyright: '© 2024 Test Artist',
      isrc: 'USRC12345678'
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should create a song with valid data', async () => {
      const song = new Song(validSongData);
      const savedSong = await song.save();
      
      expect(savedSong.title).toBe(validSongData.title);
      expect(savedSong.artist.toString()).toBe(mockArtistId.toString());
      expect(savedSong.audioFile.format).toBe('mp3');
      expect(savedSong.metadata.genre).toHaveLength(2);
      expect(savedSong.status).toBe('draft');
      expect(savedSong.stats.playCount).toBe(0);
    });

    it('should update popularity when play count changes', async () => {
      const song = new Song(validSongData);
      await song.save();
      
      song.stats.playCount = 500;
      await song.save();
      
      expect(song.stats.popularity).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle song without album', async () => {
      const songData = { ...validSongData };
      delete songData.album;
      
      const song = new Song(songData);
      const savedSong = await song.save();
      
      expect(savedSong.album).toBeUndefined();
    });

    it('should handle song with minimal metadata', async () => {
      const songData = {
        title: 'Minimal Song',
        artist: mockArtistId,
        audioFile: {
          url: 'https://example.com/song.mp3',
          duration: 180,
          format: 'mp3',
          size: 5000000
        }
      };
      
      const song = new Song(songData);
      const savedSong = await song.save();
      
      expect(savedSong.metadata.genre).toBeUndefined();
      expect(savedSong.metadata.year).toBeUndefined();
    });

    it('should handle popularity calculation with no ratings', async () => {
      const song = new Song(validSongData);
      await song.save();
      
      song.stats.playCount = 1000;
      await song.save();
      
      expect(song.stats.popularity).toBe(0.6); // Only play count weight
    });
  });

  describe('Validation Failures', () => {
    it('should fail without required fields', async () => {
      const song = new Song({});
      
      await expect(song.save()).rejects.toThrow();
    });

    it('should fail with invalid audio format', async () => {
      const songData = {
        ...validSongData,
        audioFile: {
          ...validSongData.audioFile,
          format: 'invalid'
        }
      };
      
      const song = new Song(songData);
      
      await expect(song.save()).rejects.toThrow('Invalid audio format');
    });

    it('should fail with duplicate title and artist', async () => {
      const song1 = new Song(validSongData);
      await song1.save();
      
      const song2 = new Song(validSongData);
      
      await expect(song2.save()).rejects.toThrow();
    });
  });

  describe('Status Transitions', () => {
    it('should allow valid status transitions', async () => {
      const song = new Song(validSongData);
      await song.save();
      
      song.status = 'published';
      await song.save();
      
      expect(song.status).toBe('published');
    });

    it('should fail with invalid status', async () => {
      const song = new Song(validSongData);
      await song.save();
      
      song.status = 'invalid';
      
      await expect(song.save()).rejects.toThrow();
    });
  });

  describe('Tagging System', () => {
    it('should accept valid tags', async () => {
      const song = new Song(validSongData);
      await song.save();
      
      song.tags = [
        { type: 'genre', value: 'Pop' },
        { type: 'mood', value: 'Happy' }
      ];
      
      const savedSong = await song.save();
      expect(savedSong.tags).toHaveLength(2);
    });

    it('should reject invalid tag types', async () => {
      const song = new Song(validSongData);
      await song.save();
      
      song.tags = [
        { type: 'invalid', value: 'Test' }
      ];
      
      await expect(song.save()).rejects.toThrow();
    });
  });
}); 