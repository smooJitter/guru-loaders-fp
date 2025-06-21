import actions, { cacheCreditAnalyticsData, updateCreditAnalyticsCache, exampleMutation } from '../analytics/user-credits-analytics-mutation.actions.js';
import { createMockContext } from './context.mock.js';
import { jest } from '@jest/globals';
import * as R from 'ramda';

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['ADMIN'] },
  tenant: { id: 'test-tenant' },
  ...overrides
});

let actionsArr;
beforeAll(async () => {
  actionsArr = typeof actions === 'function' ? await actions() : actions;
});

describe('user-credits-analytics-mutation.actions', () => {
  describe('cacheCreditAnalyticsData', () => {
    it('should return success (happy path)', async () => {
      const context = mockContext();
      const result = await cacheCreditAnalyticsData({ context, data: { foo: 'bar' } });
      expect(result).toEqual({ success: true });
    });
    it('should be composable', async () => {
      const context = mockContext();
      const fn = R.pipe(
        (input) => ({ ...input, data: { foo: 'bar' } }),
        cacheCreditAnalyticsData
      );
      const result = await fn({ context });
      expect(result.success).toBe(true);
    });
    it('should handle missing context gracefully', async () => {
      await expect(cacheCreditAnalyticsData({})).resolves.toEqual({ success: true });
    });
    it('should handle missing data gracefully', async () => {
      const context = mockContext();
      await expect(cacheCreditAnalyticsData({ context })).resolves.toEqual({ success: true });
    });
  });

  describe('updateCreditAnalyticsCache', () => {
    it('should return success (happy path)', async () => {
      const context = mockContext();
      const result = await updateCreditAnalyticsCache({ context, key: 'k', value: 42 });
      expect(result).toEqual({ success: true });
    });
    it('should be composable', async () => {
      const context = mockContext();
      const fn = R.pipe(
        (input) => ({ ...input, key: 'k', value: 42 }),
        updateCreditAnalyticsCache
      );
      const result = await fn({ context });
      expect(result.success).toBe(true);
    });
    it('should handle missing context gracefully', async () => {
      await expect(updateCreditAnalyticsCache({})).resolves.toEqual({ success: true });
    });
    it('should handle missing key/value gracefully', async () => {
      const context = mockContext();
      await expect(updateCreditAnalyticsCache({ context })).resolves.toEqual({ success: true });
    });
  });

  describe('exampleMutation', () => {
    it('should return an object (placeholder)', async () => {
      const context = mockContext();
      const result = await exampleMutation(context);
      expect(result).toEqual({});
    });
  });

  it('should not mutate input (purity)', async () => {
    const context = mockContext();
    const input = { context, data: { foo: 'bar' } };
    const clone = JSON.parse(JSON.stringify(input));
    await cacheCreditAnalyticsData(input);
    expect(input).toEqual(clone);
  });

  it('default export should have meta/audit tags', async () => {
    const cacheAction = actionsArr.find(a => a.name === 'cacheCreditAnalyticsData');
    const updateAction = actionsArr.find(a => a.name === 'updateCreditAnalyticsCache');
    expect(cacheAction.meta.audit).toBe(true);
    expect(updateAction.meta.audit).toBe(true);
  });
}); 