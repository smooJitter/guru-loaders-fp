import { jest } from '@jest/globals';
import eventQuery from '../event-query.actions.js';

const mockContext = { services: {}, user: {}, tenant: {} };

describe('eventQuery', () => {
  const getEvent = eventQuery.find(a => a.name === 'getEvent').method;
  const listEvents = eventQuery.find(a => a.name === 'listEvents').method;
  const searchEvents = eventQuery.find(a => a.name === 'searchEvents').method;
  const getEventsByStatus = eventQuery.find(a => a.name === 'getEventsByStatus').method;
  const getUpcomingEvents = eventQuery.find(a => a.name === 'getUpcomingEvents').method;
  const getPastEvents = eventQuery.find(a => a.name === 'getPastEvents').method;
  const getEventsByOrganizer = eventQuery.find(a => a.name === 'getEventsByOrganizer').method;
  const getEventsByTag = eventQuery.find(a => a.name === 'getEventsByTag').method;
  const getEventsInDateRange = eventQuery.find(a => a.name === 'getEventsInDateRange').method;
  const getEventsWithAvailableCapacity = eventQuery.find(a => a.name === 'getEventsWithAvailableCapacity').method;
  const getFeaturedEvents = eventQuery.find(a => a.name === 'getFeaturedEvents').method;
  const getEventStatistics = eventQuery.find(a => a.name === 'getEventStatistics').method;

  test('getEvent: happy path', async () => {
    const mockExec = jest.fn().mockResolvedValue({ _id: 'e1' });
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindById = jest.fn(() => ({ lean: mockLean }));
    const mockEvent = { findById: mockFindById };
    const context = { ...mockContext, models: { Event: mockEvent } };
    const result = await getEvent({ context, eventId: 'e1' });
    expect(result).toEqual({ _id: 'e1' });
  });
  test('getEvent: not found returns null', async () => {
    const mockExec = jest.fn().mockResolvedValue(null);
    const mockLean = jest.fn(() => ({ exec: mockExec }));
    const mockFindById = jest.fn(() => ({ lean: mockLean }));
    const mockEvent = { findById: mockFindById };
    const context = { ...mockContext, models: { Event: mockEvent } };
    const result = await getEvent({ context, eventId: 'e1' });
    expect(result).toBeNull();
  });
  test('getEvent: missing eventId throws', async () => {
    const context = { ...mockContext, models: { Event: {} } };
    await expect(getEvent({ context, eventId: null })).rejects.toThrow('Invalid input');
  });

  // Paginated queries: listEvents, searchEvents, getEventsByStatus, getUpcomingEvents, getPastEvents, getEventsByOrganizer, getEventsByTag, getEventsInDateRange, getEventsWithAvailableCapacity, getFeaturedEvents
  const paginatedTest = (fn, args = {}) => {
    test(fn + ': happy path', async () => {
      const mockEvents = [{ _id: 'e1' }, { _id: 'e2' }];
      const mockQuery = jest.fn().mockResolvedValue(mockEvents);
      const mockCount = jest.fn().mockResolvedValue(2);
      const context = { ...mockContext, models: { Event: { find: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: mockQuery }) }) }) }) }), countDocuments: mockCount } } };
      const result = await eventQuery.find(a => a.name === fn).method({ context, ...args });
      expect(result.items).toEqual(mockEvents);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });
    test(fn + ': empty result', async () => {
      const mockQuery = jest.fn().mockResolvedValue([]);
      const mockCount = jest.fn().mockResolvedValue(0);
      const context = { ...mockContext, models: { Event: { find: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: mockQuery }) }) }) }) }), countDocuments: mockCount } } };
      const result = await eventQuery.find(a => a.name === fn).method({ context, ...args });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
    test(fn + ': malformed Promise.all result', async () => {
      const mockQuery = jest.fn().mockResolvedValue(undefined);
      const mockCount = jest.fn().mockResolvedValue(undefined);
      const context = { ...mockContext, models: { Event: { find: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: () => ({ exec: mockQuery }) }) }) }) }), countDocuments: mockCount } } };
      const result = await eventQuery.find(a => a.name === fn).method({ context, ...args });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(undefined);
      expect(result.hasMore).toBe(false);
    });
  };

  paginatedTest('listEvents');
  paginatedTest('searchEvents', { query: 'foo' });
  paginatedTest('getEventsByStatus', { status: 'ACTIVE' });
  paginatedTest('getUpcomingEvents');
  paginatedTest('getPastEvents');
  paginatedTest('getEventsByOrganizer', { organizerId: 'o1' });
  paginatedTest('getEventsByTag', { tag: 'music' });
  paginatedTest('getEventsInDateRange', { start: '2024-01-01', end: '2024-01-31' });
  paginatedTest('getEventsWithAvailableCapacity');
  paginatedTest('getFeaturedEvents');

  test('getEventStatistics: happy path', async () => {
    const mockAggregate = jest.fn().mockResolvedValue([{ _id: 'ACTIVE', count: 5 }]);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventStatistics({ context });
    expect(result).toEqual([{ _id: 'ACTIVE', count: 5 }]);
  });
  test('getEventStatistics: aggregation returns undefined', async () => {
    const mockAggregate = jest.fn().mockResolvedValue(undefined);
    const context = { ...mockContext, models: { Event: { aggregate: mockAggregate } } };
    const result = await getEventStatistics({ context });
    expect(result).toEqual([]);
  });
}); 