import * as actions from '../account/user-credits-account-bulk.actions.js';
import { createMockContext } from './context.mock.js';

describe('user-credits-account-bulk.actions', () => {
  let context;
  beforeEach(() => {
    context = createMockContext();
    context.models.CreditAccount = {
      bulkWrite: jest.fn().mockResolvedValue({ matchedCount: 2, modifiedCount: 2 })
    };
  });

  describe('bulkAdjustBalances', () => {
    it('adjusts balances in bulk (happy path)', async () => {
      const result = await actions.bulkAdjustBalances({ context, adjustments: [
        { userId: 'u1', amount: 10 },
        { userId: 'u2', amount: -5 }
      ] });
      expect(result).toEqual({ matched: 2, modified: 2 });
      expect(context.models.CreditAccount.bulkWrite).toHaveBeenCalled();
    });
    it('throws on empty adjustments (fail path)', async () => {
      await expect(actions.bulkAdjustBalances({ context, adjustments: [] })).rejects.toThrow('Invalid input');
    });
    it('throws if adjustments is missing (fail path)', async () => {
      await expect(actions.bulkAdjustBalances({ context })).rejects.toThrow(/Invalid input/);
    });
    it('throws if context or CreditAccount is missing (fail path)', async () => {
      await expect(actions.bulkAdjustBalances({})).rejects.toThrow();
      await expect(actions.bulkAdjustBalances({ context: {} })).rejects.toThrow();
    });
    it('handles bulkWrite throwing (fail path)', async () => {
      context.models.CreditAccount.bulkWrite = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(actions.bulkAdjustBalances({ context, adjustments: [ { userId: 'u1', amount: 1 } ] })).rejects.toThrow('DB error');
    });
    it('returns 0 matched/modified if bulkWrite returns 0s (edge case)', async () => {
      context.models.CreditAccount.bulkWrite = jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
      const result = await actions.bulkAdjustBalances({ context, adjustments: [ { userId: 'u1', amount: 1 } ] });
      expect(result).toEqual({ matched: 0, modified: 0 });
    });
  });

  it('is composable and has audit meta', () => {
    const nsArr = actions.default;
    const bulk = nsArr.find(a => a.name === 'bulkAdjustBalances');
    expect(typeof bulk.method).toBe('function');
    expect(bulk.meta.audit).toBe(true);
  });
}); 