import { jest } from '@jest/globals';
import eventAnalytics from '../event-analytics.actions.js';

const mockContext = { services: {}, user: {}, tenant: {} };

describe('eventAnalytics', () => {
  const getEventCountByStatus = eventAnalytics.find(a => a.name === 'getEventCountByStatus').method;
  const getEventCapacityUtilization = eventAnalytics.find(a => a.name === 'getEventCapacityUtilization').method;
  const getEventCreationTrend = eventAnalytics.find(a => a.name === 'getEventCreationTrend').method;
  const getMostPopularEvents = eventAnalytics.find(a => a.name === 'getMostPopularEvents').method;
  const getEventTypeBreakdown = eventAnalytics.find(a => a.name === 'getEventTypeBreakdown').method;
  const getEventActivityTimeline = eventAnalytics.find(a => a.name === 'getEventActivityTimeline').method;

  test('getEventCountByStatus: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: 'ACTIVE', count: 5 }]);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventCountByStatus({ context });
    expect(result).toEqual([{ _id: 'ACTIVE', count: 5 }]);
  });
  test('getEventCountByStatus: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventCountByStatus({ context });
    expect(result).toEqual([]);
  });

  test('getEventCapacityUtilization: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ utilization: 0.5 }]);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventCapacityUtilization({ context });
    expect(result).toEqual([{ utilization: 0.5 }]);
  });
  test('getEventCapacityUtilization: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventCapacityUtilization({ context });
    expect(result).toEqual([]);
  });

  test('getEventCreationTrend: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: '2024-01-01', count: 2 }]);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventCreationTrend({ context });
    expect(result).toEqual([{ _id: '2024-01-01', count: 2 }]);
  });
  test('getEventCreationTrend: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventCreationTrend({ context });
    expect(result).toEqual([]);
  });

  test('getMostPopularEvents: happy path', async () => {
    const mockExec = jest.fn().mockResolvedValue([{ name: 'Event1' }]);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockLimit = jest.fn(() => ({ lean: mockLean }));
    const mockSort = jest.fn(() => ({ limit: mockLimit }));
    const mockFind = jest.fn(() => ({ sort: mockSort }));
    const context = { ...mockContext, models: { Event: { find: mockFind } } };
    const result = await getMostPopularEvents({ context });
    expect(result).toEqual([{ name: 'Event1' }]);
  });
  test('getMostPopularEvents: returns empty array if no events', async () => {
    const mockExec = jest.fn().mockResolvedValue([]);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockLimit = jest.fn(() => ({ lean: mockLean }));
    const mockSort = jest.fn(() => ({ limit: mockLimit }));
    const mockFind = jest.fn(() => ({ sort: mockSort }));
    const context = { ...mockContext, models: { Event: { find: mockFind } } };
    const result = await getMostPopularEvents({ context });
    expect(result).toEqual([]);
  });

  test('getEventTypeBreakdown: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: 'conference', count: 3 }]);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventTypeBreakdown({ context });
    expect(result).toEqual([{ _id: 'conference', count: 3 }]);
  });
  test('getEventTypeBreakdown: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventTypeBreakdown({ context });
    expect(result).toEqual([]);
  });

  test('getEventActivityTimeline: always returns empty array', async () => {
    const context = { ...mockContext };
    const result = await getEventActivityTimeline({ context, eventId: 'e1' });
    expect(result).toEqual([]);
  });
}); 