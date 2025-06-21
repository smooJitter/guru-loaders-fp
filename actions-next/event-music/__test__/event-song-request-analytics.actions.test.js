import { jest } from '@jest/globals';
import eventSongRequestAnalytics from '../song-request/event-song-request-analytics.actions.js';
import { toRequestStats } from '../song-request/event-song-request-analytics.actions.js';

const mockContext = { services: {}, user: {}, tenant: {} };

describe('eventSongRequestAnalytics', () => {
  const getRequestStats = eventSongRequestAnalytics.find(a => a.name === 'getRequestStats').method;
  const getRequestTrends = eventSongRequestAnalytics.find(a => a.name === 'getRequestTrends').method;
  const getRequestBreakdown = eventSongRequestAnalytics.find(a => a.name === 'getRequestBreakdown').method;

  test('getRequestStats: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 'pending', count: 2, creditsSpent: 2 },
      { _id: 'approved', count: 1, creditsSpent: 1 }
    ]);
    const context = { ...mockContext, models: { SongRequest: { aggregate: mockAggregate } } };
    const result = await getRequestStats({ context, userId: 'u1' });
    expect(result).toEqual({
      total: 3,
      pending: 2,
      approved: 1,
      rejected: 0,
      played: 0,
      totalCreditsSpent: 3
    });
  });
  test('getRequestStats: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { SongRequest: { aggregate: mockAggregate } } };
    const result = await getRequestStats({ context, userId: 'u1' });
    expect(result).toEqual({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      played: 0,
      totalCreditsSpent: 0
    });
  });

  test('getRequestTrends: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { day: '2024-01-01', count: 2, creditsSpent: 2 },
      { day: '2024-01-02', count: 1, creditsSpent: 1 }
    ]);
    const context = { ...mockContext, models: { SongRequest: { aggregate: mockAggregate } } };
    const result = await getRequestTrends({ context, userId: 'u1' });
    expect(result).toEqual([
      { day: '2024-01-01', count: 2, creditsSpent: 2 },
      { day: '2024-01-02', count: 1, creditsSpent: 1 }
    ]);
  });
  test('getRequestTrends: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { SongRequest: { aggregate: mockAggregate } } };
    const result = await getRequestTrends({ context, userId: 'u1' });
    expect(result).toEqual([]);
  });

  test('getRequestBreakdown: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([
      { _id: 'pending', count: 2, creditsSpent: 2 },
      { _id: 'approved', count: 1, creditsSpent: 1 }
    ]);
    const context = { ...mockContext, models: { SongRequest: { aggregate: mockAggregate } } };
    const result = await getRequestBreakdown({ context, userId: 'u1' });
    expect(result).toEqual([
      { _id: 'pending', count: 2, creditsSpent: 2 },
      { _id: 'approved', count: 1, creditsSpent: 1 }
    ]);
  });
  test('getRequestBreakdown: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { SongRequest: { aggregate: mockAggregate } } };
    const result = await getRequestBreakdown({ context, userId: 'u1' });
    expect(result).toEqual([]);
  });
});

describe('toRequestStats (unit)', () => {
  it('returns all zeros for empty array', () => {
    expect(toRequestStats([])).toEqual({
      total: 0, pending: 0, approved: 0, rejected: 0, played: 0, totalCreditsSpent: 0
    });
  });
  it('returns all zeros for null/undefined', () => {
    expect(toRequestStats(null)).toEqual({
      total: 0, pending: 0, approved: 0, rejected: 0, played: 0, totalCreditsSpent: 0
    });
    expect(toRequestStats(undefined)).toEqual({
      total: 0, pending: 0, approved: 0, rejected: 0, played: 0, totalCreditsSpent: 0
    });
  });
  it('ignores unexpected statuses', () => {
    expect(toRequestStats([
      { _id: 'foo', count: 5, creditsSpent: 2 },
      { _id: 'pending', count: 1, creditsSpent: 1 }
    ])).toEqual({
      total: 6, pending: 1, approved: 0, rejected: 0, played: 0, totalCreditsSpent: 3
    });
  });
  it('handles missing statuses', () => {
    expect(toRequestStats([
      { _id: 'approved', count: 2, creditsSpent: 2 }
    ])).toEqual({
      total: 2, pending: 0, approved: 2, rejected: 0, played: 0, totalCreditsSpent: 2
    });
  });
  it('handles all statuses present', () => {
    expect(toRequestStats([
      { _id: 'pending', count: 1, creditsSpent: 1 },
      { _id: 'approved', count: 2, creditsSpent: 2 },
      { _id: 'rejected', count: 3, creditsSpent: 3 },
      { _id: 'played', count: 4, creditsSpent: 4 }
    ])).toEqual({
      total: 10, pending: 1, approved: 2, rejected: 3, played: 4, totalCreditsSpent: 10
    });
  });
  it('handles negative and zero counts', () => {
    expect(toRequestStats([
      { _id: 'pending', count: 0, creditsSpent: 0 },
      { _id: 'approved', count: -2, creditsSpent: -2 }
    ])).toEqual({
      total: -2, pending: 0, approved: -2, rejected: 0, played: 0, totalCreditsSpent: -2
    });
  });
  it('handles missing count/creditsSpent fields', () => {
    expect(toRequestStats([
      { _id: 'pending' },
      { _id: 'approved', count: 2 },
      { _id: 'rejected', creditsSpent: 3 }
    ])).toEqual({
      total: 2, pending: 0, approved: 2, rejected: 0, played: 0, totalCreditsSpent: 3
    });
  });
}); 