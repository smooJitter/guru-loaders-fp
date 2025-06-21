import * as actions from '../transactions/user-credits-transaction-analytics.actions.js';
import { createMockContext } from './context.mock.js';
import { jest } from '@jest/globals';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['ADMIN'] },
  tenant: { id: 'test-tenant' },
  models: {
    CreditTransaction: {
      aggregate: jest.fn(() => Promise.resolve([{ _id: 'foo', count: 1, total: 100 }]))
    },
    ...overrides.models
  },
  ...overrides
});

describe('user-credits-transaction-analytics.actions', () => {
  describe('getTransactionCountByType', () => {
    it('should return count by type (happy path)', async () => {
      const context = mockContext();
      const result = await actions.getTransactionCountByType({ context });
      expect(result).toEqual([{ _id: 'foo', count: 1, total: 100 }]);
    });
    it('should throw if CreditTransaction model missing', async () => {
      const context = { models: {} };
      await expect(actions.getTransactionCountByType({ context })).rejects.toThrow('CreditTransaction model not available');
    });
    it('should throw if aggregate fails', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            aggregate: jest.fn(() => { throw new Error('DB error'); })
          }
        }
      });
      await expect(actions.getTransactionCountByType({ context })).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getTransactionVolumeTrend', () => {
    it('should return volume trend (happy path)', async () => {
      const context = mockContext();
      const result = await actions.getTransactionVolumeTrend({ context, startDate: '2024-01-01', endDate: '2024-12-31' });
      expect(result).toEqual([{ _id: 'foo', count: 1, total: 100 }]);
    });
    it('should handle invalid dates gracefully', async () => {
      const context = mockContext();
      const result = await actions.getTransactionVolumeTrend({ context, startDate: 'invalid', endDate: 'invalid' });
      expect(result).toEqual([{ _id: 'foo', count: 1, total: 100 }]);
    });
    it('should throw if aggregate fails', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            aggregate: jest.fn(() => { throw new Error('DB error'); })
          }
        }
      });
      await expect(actions.getTransactionVolumeTrend({ context })).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getTopCreditUsers', () => {
    it('should return top users (happy path)', async () => {
      const context = mockContext();
      const result = await actions.getTopCreditUsers({ context, limit: 5 });
      expect(result).toEqual([{ _id: 'foo', count: 1, total: 100 }]);
    });
    it('should clamp limit to max', async () => {
      const context = mockContext();
      await actions.getTopCreditUsers({ context, limit: 9999 });
      // No error, limit is clamped internally
      expect(context.models.CreditTransaction.aggregate).toHaveBeenCalled();
    });
    it('should use default limit if invalid', async () => {
      const context = mockContext();
      await actions.getTopCreditUsers({ context, limit: 'not-a-number' });
      expect(context.models.CreditTransaction.aggregate).toHaveBeenCalled();
    });
    it('should throw if aggregate fails', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            aggregate: jest.fn(() => { throw new Error('DB error'); })
          }
        }
      });
      await expect(actions.getTopCreditUsers({ context, limit: 5 })).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getTransactionTypeBreakdown', () => {
    it('should return breakdown by type (happy path)', async () => {
      const context = mockContext();
      const result = await actions.getTransactionTypeBreakdown({ context });
      expect(result).toEqual([{ _id: 'foo', count: 1, total: 100 }]);
    });
    it('should throw if aggregate fails', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            aggregate: jest.fn(() => { throw new Error('DB error'); })
          }
        }
      });
      await expect(actions.getTransactionTypeBreakdown({ context })).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getTransactionActivityTimeline', () => {
    it('should return empty array (placeholder)', async () => {
      const context = mockContext();
      const result = await actions.getTransactionActivityTimeline({ context, userId: 'u1' });
      expect(result).toEqual([]);
    });
  });

  // Composability test: ensure actions can be composed in a functional pipeline
  it('should allow composing analytics actions (composability)', async () => {
    const context = mockContext();
    const count = await actions.getTransactionCountByType({ context });
    const trend = await actions.getTransactionVolumeTrend({ context });
    const top = await actions.getTopCreditUsers({ context });
    const breakdown = await actions.getTransactionTypeBreakdown({ context });
    expect(count).toBeDefined();
    expect(trend).toBeDefined();
    expect(top).toBeDefined();
    expect(breakdown).toBeDefined();
  });
}); 