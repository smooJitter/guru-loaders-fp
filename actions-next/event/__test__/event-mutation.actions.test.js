import { jest } from '@jest/globals';
import eventMutation from '../event-mutation.actions.js';

const mockContext = { services: {}, user: {}, tenant: {} };

describe('eventMutation', () => {
  const createEvent = eventMutation.find(a => a.name === 'createEvent').method;
  const updateEvent = eventMutation.find(a => a.name === 'updateEvent').method;
  const deleteEvent = eventMutation.find(a => a.name === 'deleteEvent').method;
  const restoreEvent = eventMutation.find(a => a.name === 'restoreEvent').method;
  const publishEvent = eventMutation.find(a => a.name === 'publishEvent').method;
  const updateStatusEvent = eventMutation.find(a => a.name === 'updateStatusEvent').method;
  const reserveCapacityEvent = eventMutation.find(a => a.name === 'reserveCapacityEvent').method;
  const releaseCapacityEvent = eventMutation.find(a => a.name === 'releaseCapacityEvent').method;
  const bulkUpdateEvents = eventMutation.find(a => a.name === 'bulkUpdateEvents').method;
  const bulkDeleteEvents = eventMutation.find(a => a.name === 'bulkDeleteEvents').method;

  test('createEvent: happy path', async () => {
    const mockSave = jest.fn().mockResolvedValue({ toObject: () => ({ name: 'Event1' }) });
    const mockEvent = function (data) { Object.assign(this, data); };
    mockEvent.prototype.save = mockSave;
    const context = { ...mockContext, models: { Event: mockEvent } };
    const result = await createEvent({ context, name: 'Event1' });
    expect(result).toEqual({ name: 'Event1' });
    expect(mockSave).toHaveBeenCalled();
  });

  const makeUpdateTest = (fn, update, resultObj = { _id: 'e1' }) => {
    test(fn + ': happy path', async () => {
      const mockExec = jest.fn().mockResolvedValue(resultObj);
      const mockLean = jest.fn(() => ({ exec: mockExec }));
      const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
      const mockEvent = { findByIdAndUpdate: mockFindByIdAndUpdate };
      const context = { ...mockContext, models: { Event: mockEvent } };
      const result = await eventMutation.find(a => a.name === fn).method({ context, eventId: 'e1', ...update });
      expect(result).toEqual(resultObj);
    });
    test(fn + ': not found throws', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockLean = jest.fn(() => ({ exec: mockExec }));
      const mockFindByIdAndUpdate = jest.fn(() => ({ lean: mockLean }));
      const mockEvent = { findByIdAndUpdate: mockFindByIdAndUpdate };
      const context = { ...mockContext, models: { Event: mockEvent } };
      await expect(eventMutation.find(a => a.name === fn).method({ context, eventId: 'e1', ...update })).rejects.toThrow('Event not found: e1');
    });
  };

  makeUpdateTest('updateEvent', { data: { name: 'Updated' } }, { _id: 'e1', name: 'Updated' });
  makeUpdateTest('deleteEvent', {}, { _id: 'e1', status: 'DELETED' });
  makeUpdateTest('restoreEvent', {}, { _id: 'e1', status: 'ACTIVE' });
  makeUpdateTest('publishEvent', {}, { _id: 'e1', status: 'PUBLISHED' });
  makeUpdateTest('updateStatusEvent', { status: 'CANCELLED' }, { _id: 'e1', status: 'CANCELLED' });
  makeUpdateTest('reserveCapacityEvent', { count: 2 }, { _id: 'e1', attendeeCount: 10 });
  makeUpdateTest('releaseCapacityEvent', { count: 2 }, { _id: 'e1', attendeeCount: 8 });

  test('bulkUpdateEvents: happy path', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
    const mockEvent = { updateMany: mockUpdateMany };
    const context = { ...mockContext, models: { Event: mockEvent } };
    const result = await bulkUpdateEvents({ context, eventIds: ['e1', 'e2'], data: { status: 'ACTIVE' } });
    expect(result).toEqual({ matched: 2, modified: 2 });
  });
  test('bulkDeleteEvents: happy path', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
    const mockEvent = { updateMany: mockUpdateMany };
    const context = { ...mockContext, models: { Event: mockEvent } };
    const result = await bulkDeleteEvents({ context, eventIds: ['e1', 'e2'] });
    expect(result).toEqual({ matched: 2, modified: 2 });
  });
}); 