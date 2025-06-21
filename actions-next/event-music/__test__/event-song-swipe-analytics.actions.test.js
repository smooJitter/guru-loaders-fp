import { jest } from '@jest/globals';
import eventSongSwipeAnalytics from '../song-swipe/event-song-swipe-analytics.actions.js';
import * as R from 'ramda';

const mockContext = { services: {}, user: {}, tenant: {} };

// Extract methods
const getSongAnalytics = eventSongSwipeAnalytics.find(a => a.name === 'getSongAnalytics').method;
const getStats = eventSongSwipeAnalytics.find(a => a.name === 'getStats').method;
const getSwipeTrends = eventSongSwipeAnalytics.find(a => a.name === 'getSwipeTrends').method;
const getSwipeHeatmap = eventSongSwipeAnalytics.find(a => a.name === 'getSwipeHeatmap').method;
const getUserSegmentation = eventSongSwipeAnalytics.find(a => a.name === 'getUserSegmentation').method;

// --- getSongAnalytics ---
describe('getSongAnalytics', () => {
  it('happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 'left', count: 2, uniqueUsers: ['u1', 'u2'] },
      { _id: 'right', count: 3, uniqueUsers: ['u1', 'u3', 'u4'] }
    ]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getSongAnalytics({ context, songId: 's1' });
    expect(result).toEqual({
      total: 5,
      left: 2,
      right: 3,
      uniqueUsers: 3,
      matchRate: 60
    });
  });
  it('handles empty aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getSongAnalytics({ context, songId: 's1' });
    expect(result).toEqual({ total: 0, left: 0, right: 0, uniqueUsers: 0, matchRate: 0 });
  });
  it('handles null aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(null);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getSongAnalytics({ context, songId: 's1' });
    expect(result).toEqual({ total: 0, left: 0, right: 0, uniqueUsers: 0, matchRate: 0 });
  });
});

// --- getStats ---
describe('getStats', () => {
  it('happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 'left', count: 2, songs: ['s1', 's2'] },
      { _id: 'right', count: 3, songs: ['s1', 's3', 's4'] }
    ]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getStats({ context, userId: 'u1' });
    expect(result).toEqual({
      total: 5,
      left: 2,
      right: 3,
      uniqueSongs: 4
    });
  });
  it('handles empty aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getStats({ context, userId: 'u1' });
    expect(result).toEqual({ total: 0, left: 0, right: 0, uniqueSongs: 0 });
  });
  it('handles null aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(null);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getStats({ context, userId: 'u1' });
    expect(result).toEqual({ total: 0, left: 0, right: 0, uniqueSongs: 0 });
  });
});

// --- getSwipeTrends ---
describe('getSwipeTrends', () => {
  it('happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { day: '2024-01-01', count: 2 },
      { day: '2024-01-02', count: 1 }
    ]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getSwipeTrends({ context, userId: 'u1' });
    expect(result).toEqual([
      { day: '2024-01-01', count: 2 },
      { day: '2024-01-02', count: 1 }
    ]);
  });
  it('handles empty aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getSwipeTrends({ context, userId: 'u1' });
    expect(result).toEqual([]);
  });
  it('handles null aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(null);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getSwipeTrends({ context, userId: 'u1' });
    expect(result).toEqual([]);
  });
});

// --- getSwipeHeatmap ---
describe('getSwipeHeatmap', () => {
  it('happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: { weekday: 1, hour: 0 }, count: 2 },
      { _id: { weekday: 1, hour: 1 }, count: 3 },
      { _id: { weekday: 2, hour: 0 }, count: 1 }
    ]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    // Patch the function to use the mockAggregate result
    const orig = context.models.SongSwipe.aggregate;
    context.models.SongSwipe.aggregate = async () => [
      { _id: { weekday: 1, hour: 0 }, count: 2 },
      { _id: { weekday: 1, hour: 1 }, count: 3 },
      { _id: { weekday: 2, hour: 0 }, count: 1 }
    ];
    const result = await getSwipeHeatmap({ context, userId: 'u1' });
    expect(result[0][0]).toBe(2); // Monday 0:00
    expect(result[0][1]).toBe(3); // Monday 1:00
    expect(result[1][0]).toBe(1); // Tuesday 0:00
    expect(result[6][23]).toBe(0); // Sunday 23:00
    context.models.SongSwipe.aggregate = orig;
  });
  it('handles empty aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    context.models.SongSwipe.aggregate = async () => [];
    const result = await getSwipeHeatmap({ context, userId: 'u1' });
    expect(result.length).toBe(7);
    expect(result[0].length).toBe(24);
    expect(result.flat().every(x => x === 0)).toBe(true);
  });
});

// --- getUserSegmentation ---
describe('getUserSegmentation', () => {
  it('happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 'left', count: 2, songs: ['s1', 's2'] },
      { _id: 'right', count: 3, songs: ['s1', 's3', 's4'] }
    ]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getUserSegmentation({ context, userId: 'u1' });
    expect(result).toEqual([
      { direction: 'left', count: 2, uniqueSongs: 2 },
      { direction: 'right', count: 3, uniqueSongs: 3 }
    ]);
  });
  it('handles empty aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([]);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getUserSegmentation({ context, userId: 'u1' });
    expect(result).toEqual([]);
  });
  it('handles null aggregation', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(null);
    const context = { ...mockContext, models: { SongSwipe: { aggregate: mockAggregate } } };
    const result = await getUserSegmentation({ context, userId: 'u1' });
    expect(result).toEqual([]);
  });
});

// Direct unit tests for pure transformation functions
describe('toSongAnalytics (unit)', () => {
  const { toSongAnalytics } = jest.requireActual('../song-swipe/event-song-swipe-analytics.actions.js');
  it('returns all zeros for empty array', () => {
    expect(toSongAnalytics([])).toEqual({ total: 0, left: 0, right: 0, uniqueUsers: 0, matchRate: 0 });
  });
  it('returns all zeros for null/undefined', () => {
    expect(toSongAnalytics(null)).toEqual({ total: 0, left: 0, right: 0, uniqueUsers: 0, matchRate: 0 });
    expect(toSongAnalytics(undefined)).toEqual({ total: 0, left: 0, right: 0, uniqueUsers: 0, matchRate: 0 });
  });
  it('handles missing fields and unexpected keys', () => {
    expect(toSongAnalytics([{ _id: 'foo', count: 5 }, { _id: 'left' }])).toEqual({
      total: 5, left: 0, right: 0, uniqueUsers: 0, matchRate: 0, foo: 5
    });
  });
  it('handles duplicate users in uniqueUsers', () => {
    expect(toSongAnalytics([
      { _id: 'left', count: 2, uniqueUsers: ['u1', 'u2', 'u1'] },
      { _id: 'right', count: 3, uniqueUsers: ['u2', 'u3'] }
    ])).toEqual({
      total: 5, left: 2, right: 3, uniqueUsers: 3, matchRate: 60
    });
  });
  it('handles negative and zero counts', () => {
    expect(toSongAnalytics([
      { _id: 'left', count: 0, uniqueUsers: [] },
      { _id: 'right', count: -2, uniqueUsers: [] }
    ])).toEqual({
      total: -2, left: 0, right: -2, uniqueUsers: 0, matchRate: 0
    });
  });
});

describe('toUserStats (unit)', () => {
  const { toUserStats } = jest.requireActual('../song-swipe/event-song-swipe-analytics.actions.js');
  it('returns all zeros for empty array', () => {
    expect(toUserStats([])).toEqual({ total: 0, left: 0, right: 0, uniqueSongs: 0 });
  });
  it('returns all zeros for null/undefined', () => {
    expect(toUserStats(null)).toEqual({ total: 0, left: 0, right: 0, uniqueSongs: 0 });
    expect(toUserStats(undefined)).toEqual({ total: 0, left: 0, right: 0, uniqueSongs: 0 });
  });
  it('handles missing fields and unexpected keys', () => {
    expect(toUserStats([{ _id: 'foo', count: 5 }, { _id: 'left' }])).toEqual({
      total: 5, left: 0, right: 0, uniqueSongs: 0, foo: 5
    });
  });
  it('handles duplicate songs in uniqueSongs', () => {
    expect(toUserStats([
      { _id: 'left', count: 2, songs: ['s1', 's2', 's1'] },
      { _id: 'right', count: 3, songs: ['s2', 's3'] }
    ])).toEqual({
      total: 5, left: 2, right: 3, uniqueSongs: 3
    });
  });
  it('handles negative and zero counts', () => {
    expect(toUserStats([
      { _id: 'left', count: 0, songs: [] },
      { _id: 'right', count: -2, songs: [] }
    ])).toEqual({
      total: -2, left: 0, right: -2, uniqueSongs: 0
    });
  });
}); 