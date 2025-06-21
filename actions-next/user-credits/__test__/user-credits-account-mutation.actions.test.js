import * as actions from '../account/user-credits-account-mutation.actions.js';
import { createMockContext } from './context.mock.js';

describe('user-credits-account-mutation.actions', () => {
  let context;
  beforeEach(() => {
    context = createMockContext();
    context.models.CreditAccount = jest.fn().mockImplementation((data) => ({
      save: jest.fn().mockResolvedValue({ toObject: () => ({ ...data, _id: 'acc1' }) })
    }));
    context.models.CreditAccount.findOneAndUpdate = jest.fn().mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({ userId: 'u1', balance: 100 }) })
    });
  });

  describe('createCreditAccount', () => {
    it('creates account (happy path)', async () => {
      const result = await actions.createCreditAccount({ context, userId: 'u1', balance: 0 });
      expect(result).toMatchObject({ userId: 'u1', balance: 0, _id: 'acc1' });
    });
    it('throws on missing userId (fail path)', async () => {
      await expect(actions.createCreditAccount({ context })).rejects.toThrow('Invalid credit account: Validation failed');
    });
    it('throws if context or CreditAccount is missing (fail path)', async () => {
      await expect(actions.createCreditAccount({})).rejects.toThrow();
      await expect(actions.createCreditAccount({ context: {} })).rejects.toThrow();
    });
    it('throws if CreditAccount.save throws (fail path)', async () => {
      context.models.CreditAccount = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error'))
      }));
      await expect(actions.createCreditAccount({ context, userId: 'u1' })).rejects.toThrow('DB error');
    });
    it('returns null if sanitizeAccount gets null (edge case)', async () => {
      // Simulate toObject returning null
      context.models.CreditAccount = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ toObject: () => null })
      }));
      const result = await actions.createCreditAccount({ context, userId: 'u1' });
      expect(result).toBeNull();
    });
  });

  describe('adjustCreditAccountBalance', () => {
    it('adjusts balance (happy path)', async () => {
      const result = await actions.adjustCreditAccountBalance({ context, userId: 'u1', amount: 10 });
      expect(result).toMatchObject({ userId: 'u1', balance: 100 });
    });
    it('returns null if no account (edge case)', async () => {
      context.models.CreditAccount.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const result = await actions.adjustCreditAccountBalance({ context, userId: 'u2', amount: 10 });
      expect(result).toBeNull();
    });
    it('throws if context or CreditAccount is missing (fail path)', async () => {
      await expect(actions.adjustCreditAccountBalance({})).rejects.toThrow();
      await expect(actions.adjustCreditAccountBalance({ context: {} })).rejects.toThrow();
    });
    it('throws if findOneAndUpdate throws (fail path)', async () => {
      context.models.CreditAccount.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.reject(new Error('DB error')) })
      });
      await expect(actions.adjustCreditAccountBalance({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('returns null if sanitizeAccount gets null (edge case)', async () => {
      context.models.CreditAccount.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const result = await actions.adjustCreditAccountBalance({ context, userId: 'u1', amount: 10 });
      expect(result).toBeNull();
    });
  });

  it('is composable and has audit meta', () => {
    const nsArr = actions.default;
    const create = nsArr.find(a => a.name === 'createCreditAccount');
    expect(typeof create.method).toBe('function');
    expect(create.meta.audit).toBe(true);
  });
}); 