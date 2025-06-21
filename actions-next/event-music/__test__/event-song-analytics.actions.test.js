import { jest } from '@jest/globals';
import eventSongAnalytics from '../song/event-song-analytics.actions.js';

const mockContext = { services: {}, user: {}, tenant: {} };

describe('eventSongAnalytics', () => {
  const getSongPlayTrends = eventSongAnalytics.find(a => a.name === 'getSongPlayTrends').method;
  const getTopRatedSongsAnalytics = eventSongAnalytics.find(a => a.name === 'getTopRatedSongsAnalytics').method;
  const getSongRatingDistribution = eventSongAnalytics.find(a => a.name === 'getSongRatingDistribution').method;
  const getSongPlayHeatmap = eventSongAnalytics.find(a => a.name === 'getSongPlayHeatmap').method;
  const getSongChurnAnalytics = eventSongAnalytics.find(a => a.name === 'getSongChurnAnalytics').method;
  const getSongSegmentationAnalytics = eventSongAnalytics.find(a => a.name === 'getSongSegmentationAnalytics').method;

  test('getSongPlayTrends: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: '2024-01-01', playCount: 5 }]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongPlayTrends({ context, id: 's1' });
    expect(result).toEqual([{ _id: '2024-01-01', playCount: 5 }]);
  });
  test('getSongPlayTrends: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongPlayTrends({ context, id: 's1' });
    expect(result).toEqual([]);
  });

  test('getSongPlayTrends: period week', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: '2024-01', playCount: 2 }]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongPlayTrends({ context, id: 's1', period: 'week' });
    expect(result).toEqual([{ _id: '2024-01', playCount: 2 }]);
  });
  test('getSongPlayTrends: period month', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: '2024-06', playCount: 1 }]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongPlayTrends({ context, id: 's1', period: 'month' });
    expect(result).toEqual([{ _id: '2024-06', playCount: 1 }]);
  });
  test('getSongPlayTrends: start and end as Date objects', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: '2024-01-01', playCount: 1 }]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    const result = await getSongPlayTrends({ context, id: 's1', start, end });
    expect(result).toEqual([{ _id: '2024-01-01', playCount: 1 }]);
  });

  test('getTopRatedSongsAnalytics: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 's1', title: 'Song1', artist: 'Artist1', avgRating: 4.5 }
    ]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getTopRatedSongsAnalytics({ context });
    expect(result).toEqual([{ _id: 's1', title: 'Song1', artist: 'Artist1', avgRating: 4.5 }]);
  });
  test('getTopRatedSongsAnalytics: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getTopRatedSongsAnalytics({ context });
    expect(result).toEqual([]);
  });

  test('getTopRatedSongsAnalytics: with limit', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 's1', title: 'Song1', artist: 'Artist1', avgRating: 4.5 },
      { _id: 's2', title: 'Song2', artist: 'Artist2', avgRating: 4.0 }
    ]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getTopRatedSongsAnalytics({ context, limit: 2 });
    expect(result).toEqual([
      { _id: 's1', title: 'Song1', artist: 'Artist1', avgRating: 4.5 },
      { _id: 's2', title: 'Song2', artist: 'Artist2', avgRating: 4.0 }
    ]);
  });

  test('getSongRatingDistribution: happy path', async () => {
    const mockFindById = jest.fn().mockReturnValue({ lean: () => ({ exec: () => Promise.resolve({ ratings: [ { value: 5 }, { value: 4 }, { value: 5 } ] }) }) });
    const context = { ...mockContext, models: { Song: { findById: mockFindById } } };
    const result = await getSongRatingDistribution({ context, id: 's1' });
    expect(result).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 1 },
      { value: 5, count: 2 }
    ]);
  });
  test('getSongRatingDistribution: no song', async () => {
    const mockFindById = jest.fn().mockReturnValue({ lean: () => ({ exec: () => Promise.resolve(null) }) });
    const context = { ...mockContext, models: { Song: { findById: mockFindById } } };
    const result = await getSongRatingDistribution({ context, id: 's1' });
    expect(result).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
      { value: 5, count: 0 }
    ]);
  });

  test('getSongRatingDistribution: undefined ratings', async () => {
    const mockFindById = jest.fn().mockReturnValue({ lean: () => ({ exec: () => Promise.resolve({}) }) });
    const context = { ...mockContext, models: { Song: { findById: mockFindById } } };
    const result = await getSongRatingDistribution({ context, id: 's1' });
    expect(result).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
      { value: 5, count: 0 }
    ]);
  });

  test('getSongPlayHeatmap: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: { weekday: 1, hour: 0 }, count: 2 },
      { _id: { weekday: 1, hour: 1 }, count: 1 }
    ]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongPlayHeatmap({ context, id: 's1' });
    expect(result[0][0]).toBe(2); // Monday 0:00
    expect(result[0][1]).toBe(1); // Monday 1:00
    expect(result[1][0]).toBe(0); // Tuesday 0:00
  });
  test('getSongPlayHeatmap: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongPlayHeatmap({ context, id: 's1' });
    expect(result).toHaveLength(7);
    expect(result[0]).toHaveLength(24);
    expect(result.flat().every(x => x === 0)).toBe(true);
  });

  test('getSongChurnAnalytics: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 'u1', playCount: 3, lastPlayed: '2024-01-01' }
    ]);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongChurnAnalytics({ context, id: 's1' });
    expect(result).toEqual([{ _id: 'u1', playCount: 3, lastPlayed: '2024-01-01' }]);
  });
  test('getSongChurnAnalytics: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongChurnAnalytics({ context, id: 's1' });
    expect(result).toEqual([]);
  });

  test('getSongSegmentationAnalytics: happy path', async () => {
    const mockAggregate = jest.fn()
      .mockResolvedValueOnce([{ _id: 5, count: 2 }]) // byRating
      .mockResolvedValueOnce([{ _id: 0, count: 1 }, { _id: 10, count: 2 }]); // byPlayCount
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongSegmentationAnalytics({ context, id: 's1' });
    expect(result.byRating).toEqual([{ _id: 5, count: 2 }]);
    expect(result.byPlayCount).toEqual([{ _id: 0, count: 1 }, { _id: 10, count: 2 }]);
  });
  test('getSongSegmentationAnalytics: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Song: { aggregate: mockAggregate } } };
    const result = await getSongSegmentationAnalytics({ context, id: 's1' });
    expect(result.byRating).toEqual([]);
    expect(result.byPlayCount).toEqual([]);
  });
});

describe('utility edge cases', () => {
  // Import or copy the utility functions for direct testing
  const { getGroupByForPeriod, getRatingDistribution, safeAggregate } = jest.requireActual('../song/event-song-analytics.actions.js');

  test('getGroupByForPeriod: unknown/undefined/null/empty', () => {
    expect(getGroupByForPeriod()).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$lastPlayedAt' } });
    expect(getGroupByForPeriod('')).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$lastPlayedAt' } });
    expect(getGroupByForPeriod(null)).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$lastPlayedAt' } });
    expect(getGroupByForPeriod('unknown')).toEqual({ $dateToString: { format: '%Y-%m-%d', date: '$lastPlayedAt' } });
  });

  test('getRatingDistribution: null/undefined/non-array', () => {
    expect(getRatingDistribution()).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
      { value: 5, count: 0 }
    ]);
    expect(getRatingDistribution(null)).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
      { value: 5, count: 0 }
    ]);
    expect(getRatingDistribution('not an array')).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
      { value: 5, count: 0 }
    ]);
    expect(getRatingDistribution([{ }])).toEqual([
      { value: 1, count: 0 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
      { value: 5, count: 0 }
    ]);
  });

  test('safeAggregate: undefined/null/non-array/array', () => {
    expect(safeAggregate(undefined)).toEqual([]);
    expect(safeAggregate(null)).toEqual([]);
    expect(safeAggregate('not an array')).toEqual([]);
    expect(safeAggregate([])).toEqual([]);
    expect(safeAggregate([1,2,3])).toEqual([1,2,3]);
  });
}); 