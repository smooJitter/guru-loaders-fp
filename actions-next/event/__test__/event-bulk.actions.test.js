import { jest } from '@jest/globals';
import eventBulk from '../event-bulk.actions.js';

const mockContext = { services: {}, user: {}, tenant: {} };

describe('eventBulk', () => {
  const bulkUpdateEvents = eventBulk.find(a => a.name === 'bulkUpdateEvents').method;
  const bulkDeleteEvents = eventBulk.find(a => a.name === 'bulkDeleteEvents').method;
  const bulkRestoreEvents = eventBulk.find(a => a.name === 'bulkRestoreEvents').method;

  test('bulkUpdateEvents: happy path', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    const result = await bulkUpdateEvents({ context, eventIds: ['e1', 'e2'], data: { name: 'Updated' } });
    expect(result).toEqual({ matched: 2, modified: 2 });
    expect(mockUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: ['e1', 'e2'] } },
      { $set: { name: 'Updated' } }
    );
  });
  test('bulkUpdateEvents: no matches', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    const result = await bulkUpdateEvents({ context, eventIds: ['e3'], data: { name: 'NoMatch' } });
    expect(result).toEqual({ matched: 0, modified: 0 });
  });

  test('bulkDeleteEvents: happy path', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    const result = await bulkDeleteEvents({ context, eventIds: ['e1', 'e2'] });
    expect(result).toEqual({ matched: 2, modified: 2 });
    expect(mockUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: ['e1', 'e2'] } },
      { $set: { deletedAt: expect.any(Date), status: 'DELETED' } }
    );
  });
  test('bulkDeleteEvents: no matches', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    const result = await bulkDeleteEvents({ context, eventIds: ['e3'] });
    expect(result).toEqual({ matched: 0, modified: 0 });
  });

  test('bulkRestoreEvents: happy path', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    const result = await bulkRestoreEvents({ context, eventIds: ['e1', 'e2'] });
    expect(result).toEqual({ matched: 2, modified: 2 });
    expect(mockUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: ['e1', 'e2'] } },
      { $set: { deletedAt: null, status: 'ACTIVE' } }
    );
  });
  test('bulkRestoreEvents: no matches', async () => {
    const mockUpdateMany = jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    const result = await bulkRestoreEvents({ context, eventIds: ['e3'] });
    expect(result).toEqual({ matched: 0, modified: 0 });
  });

  test('bulkUpdateEvents: throws on model error', async () => {
    const mockUpdateMany = jest.fn().mockRejectedValue(new Error('DB error'));
    const context = { ...mockContext, models: { Event: { updateMany: mockUpdateMany } } };
    await expect(bulkUpdateEvents({ context, eventIds: ['e1'], data: { name: 'fail' } })).rejects.toThrow('DB error');
  });
}); 