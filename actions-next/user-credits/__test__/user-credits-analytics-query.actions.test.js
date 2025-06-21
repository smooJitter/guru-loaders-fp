import * as actions from '../analytics/user-credits-analytics-query.actions.js';
import { createMockContext } from './context.mock.js';
import { getCreditBalanceHistory, getCreditUsageTrends, exampleQuery } from '../analytics/user-credits-analytics-query.actions.js';
import analyticsModule from '../analytics/user-credits-analytics-query.actions.js';
import { jest } from '@jest/globals';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['ADMIN'] },
  tenant: { id: 'test-tenant' },
  models: {
    CreditTransaction: {
      aggregate: jest.fn(() => Promise.resolve([{ _id: '2024-01-01', balance: 100, transactions: [] }]))
    },
    ...overrides.models
  },
  ...overrides
});

describe('user-credits-analytics-query.actions', () => {
  describe('getCreditBalanceHistory', () => {
    it('should return balance history (happy path)', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context, startDate: '2024-01-01', endDate: '2024-12-31', interval: 'month', userId: 'u1' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle invalid dates gracefully', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context, startDate: 'invalid', endDate: 'invalid' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should throw if model missing', async () => {
      const context = { models: {} };
      await expect(getCreditBalanceHistory({ context })).rejects.toThrow('model not available');
    });
    it('should throw if aggregate fails', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            aggregate: jest.fn(() => { throw new Error('DB error'); })
          }
        }
      });
      await expect(getCreditBalanceHistory({ context })).rejects.toThrow('DB error');
    });
    it('should handle missing userId', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle invalid interval gracefully', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context, interval: 'not-a-real-interval' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle only startDate', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context, startDate: '2024-01-01' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle only endDate', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context, endDate: '2024-12-31' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
  });

  describe('getCreditUsageTrends', () => {
    it('should return usage trends (happy path)', async () => {
      const context = mockContext();
      const result = await getCreditUsageTrends({ context, startDate: '2024-01-01', endDate: '2024-12-31', interval: 'month' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle invalid dates gracefully', async () => {
      const context = mockContext();
      const result = await getCreditUsageTrends({ context, startDate: 'invalid', endDate: 'invalid' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should throw if model missing', async () => {
      const context = { models: {} };
      await expect(getCreditUsageTrends({ context })).rejects.toThrow('model not available');
    });
    it('should throw if aggregate fails', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            aggregate: jest.fn(() => { throw new Error('DB error'); })
          }
        }
      });
      await expect(getCreditUsageTrends({ context })).rejects.toThrow('DB error');
    });
    it('should handle invalid interval gracefully', async () => {
      const context = mockContext();
      const result = await getCreditUsageTrends({ context, interval: 'not-a-real-interval' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle only startDate', async () => {
      const context = mockContext();
      const result = await getCreditUsageTrends({ context, startDate: '2024-01-01' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
    it('should handle only endDate', async () => {
      const context = mockContext();
      const result = await getCreditUsageTrends({ context, endDate: '2024-12-31' });
      expect(result).toEqual([{ _id: '2024-01-01', balance: 100, transactions: [] }]);
    });
  });

  describe('exampleQuery', () => {
    it('should return an object (placeholder)', async () => {
      const context = mockContext();
      const result = await exampleQuery(context);
      expect(result).toEqual({});
    });
  });

  it('should not mutate input (purity)', async () => {
    const context = mockContext();
    const input = { context, startDate: '2024-01-01' };
    const clone = {
      startDate: input.startDate,
      user: { ...input.context.user },
      tenant: { ...input.context.tenant }
    };
    await getCreditBalanceHistory(input);
    expect(input.startDate).toBe(clone.startDate);
    expect(input.context.user).toEqual(clone.user);
    expect(input.context.tenant).toEqual(clone.tenant);
  });

  it('default export should have meta/audit tags', async () => {
    const ns = typeof analyticsModule === 'function' ? await analyticsModule() : analyticsModule;
    const balanceAction = ns.find(a => a.name === 'getCreditBalanceHistory');
    const usageAction = ns.find(a => a.name === 'getCreditUsageTrends');
    expect(balanceAction.meta.audit).toBe(true);
    expect(usageAction.meta.audit).toBe(true);
  });
}); 