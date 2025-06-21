import * as eventSongSwipeActionsModule from '../song-swipe/event-song-swipe-mutation.actions.js';
const actionsArr = eventSongSwipeActionsModule.default || eventSongSwipeActionsModule;
const actions = Object.fromEntries(actionsArr.map(a => [a.name, a]));

import {
  createSwipeRight,
  createSwipeLeft,
  createSwipeUp,
  bulkCreateSwipes,
  undoSwipe
} from '../song-swipe/event-song-swipe-mutation.actions.js';

describe('event-song-swipe mutation actions', () => {
  let mockContext;
  let mockSong;
  let mockSwipe;

  beforeEach(() => {
    mockSong = { _id: 'song1', title: 'Test', artist: 'artist1' };
    mockSwipe = { _id: 'swipe1', userId: 'user1', songId: 'song1', direction: 'right' };
    mockContext = {
      models: {
        Song: { findById: jest.fn(() => mockSong) },
        SongSwipe: { create: jest.fn(() => mockSwipe) }
      },
      services: { events: { emit: jest.fn() } }
    };
  });

  describe('createSwipeRight', () => {
    it('should create a right swipe (happy path)', async () => {
      const input = {
        context: mockContext,
        userId: 'user1',
        songId: 'song1',
        reason: 'like',
        location: 'venue',
        event: 'event1',
        direction: 'right'
      };
      const result = await createSwipeRight(input);
      expect(result).toHaveProperty('_id', 'swipe1');
    });
    it('should fail if required fields are missing', async () => {
      const input = { context: mockContext, userId: 'user1', direction: 'right' };
      await expect(createSwipeRight(input)).rejects.toThrow('songId is a required field');
    });
  });

  describe('createSwipeLeft', () => {
    it('should create a left swipe (happy path)', async () => {
      const input = {
        context: mockContext,
        userId: 'user1',
        songId: 'song1',
        reason: 'dislike',
        location: 'venue',
        event: 'event1'
      };
      const result = await createSwipeLeft(input);
      expect(result).toHaveProperty('_id', 'swipe1');
    });
    it('should fail if required fields are missing', async () => {
      const input = { context: mockContext, userId: 'user1' };
      await expect(createSwipeLeft(input)).rejects.toThrow('songId is a required field');
    });
  });

  describe('createSwipeUp', () => {
    it('should create an up swipe (happy path)', async () => {
      const input = {
        context: mockContext,
        userId: 'user1',
        songId: 'song1',
        reason: 'favorite',
        location: 'venue',
        event: 'event1'
      };
      const result = await createSwipeUp(input);
      expect(result).toHaveProperty('_id', 'swipe1');
    });
    it('should fail if required fields are missing', async () => {
      const input = { context: mockContext, userId: 'user1' };
      await expect(createSwipeUp(input)).rejects.toThrow('songId is a required field');
    });
  });

  describe('bulkCreateSwipes', () => {
    it('returns success and count (future-proofed)', async () => {
      const context = mockContext;
      const { bulkCreateSwipes } = actions;
      const result = await bulkCreateSwipes.method({ context, swipes: [{ userId: 'u1', songId: 's1', direction: 'right' }] });
      expect(result).toEqual({ success: true, count: 1 });
    });
    it('throws for missing context', async () => {
      const { bulkCreateSwipes } = actions;
      await expect(bulkCreateSwipes.method({ swipes: [{ userId: 'u1', songId: 's1', direction: 'right' }] })).rejects.toThrow();
    });
    it('throws for missing swipes', async () => {
      const context = mockContext;
      const { bulkCreateSwipes } = actions;
      await expect(bulkCreateSwipes.method({ context })).rejects.toThrow();
    });
    it('throws for empty swipes array', async () => {
      const context = mockContext;
      const { bulkCreateSwipes } = actions;
      await expect(bulkCreateSwipes.method({ context, swipes: [] })).rejects.toThrow();
    });
  });

  describe('undoSwipe', () => {
    it('returns success and swipeId (future-proofed)', async () => {
      const context = mockContext;
      const { undoSwipe } = actions;
      const result = await undoSwipe.method({ context, swipeId: 'swipe1' });
      expect(result).toEqual({ success: true, swipeId: 'swipe1' });
    });
    it('throws for missing context', async () => {
      const { undoSwipe } = actions;
      await expect(undoSwipe.method({ swipeId: 'swipe1' })).rejects.toThrow();
    });
    it('throws for missing swipeId', async () => {
      const context = mockContext;
      const { undoSwipe } = actions;
      await expect(undoSwipe.method({ context })).rejects.toThrow();
    });
  });
}); 