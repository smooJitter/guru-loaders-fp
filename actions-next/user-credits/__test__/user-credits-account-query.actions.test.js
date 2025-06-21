import * as actions from '../account/user-credits-account-query.actions.js';
import { createMockContext } from './context.mock.js';

const { sanitizeAccount } = actions;

describe('user-credits-account-query.actions', () => {
  let context;
  beforeEach(() => {
    context = createMockContext();
    context.models.CreditAccount = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve({ userId: 'u1', balance: 100 }) })
      })
    };
  });

  describe('getOrCreateAccount', () => {
    it('returns account (happy path)', async () => {
      const result = await actions.getOrCreateAccount({ context, userId: 'u1' });
      expect(result).toMatchObject({ userId: 'u1', balance: 100 });
    });
    it('returns null if not found (edge case)', async () => {
      context.models.CreditAccount.findOne = jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const result = await actions.getOrCreateAccount({ context, userId: 'u2' });
      expect(result).toBeNull();
    });
  });

  describe('getCreditAccountByUser', () => {
    it('returns account (happy path)', async () => {
      const result = await actions.getCreditAccountByUser({ context, userId: 'u1' });
      expect(result).toMatchObject({ userId: 'u1', balance: 100 });
    });
    it('returns null if not found (edge case)', async () => {
      context.models.CreditAccount.findOne = jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const result = await actions.getCreditAccountByUser({ context, userId: 'u2' });
      expect(result).toBeNull();
    });
  });

  describe('getBalance', () => {
    it('returns balance (happy path)', async () => {
      const result = await actions.getBalance({ context, userId: 'u1' });
      expect(result).toBe(100);
    });
    it('returns 0 if not found (edge case)', async () => {
      context.models.CreditAccount.findOne = jest.fn().mockReturnValue({
        lean: () => ({ exec: () => Promise.resolve(null) })
      });
      const result = await actions.getBalance({ context, userId: 'u2' });
      expect(result).toBe(0);
    });
  });

  it('is composable and has audit meta', () => {
    const nsArr = actions.default;
    const getOrCreate = nsArr.find(a => a.name === 'getOrCreateAccount');
    expect(typeof getOrCreate.method).toBe('function');
    expect(getOrCreate.meta.audit).toBe(true);
  });

  describe('sanitizeAccount', () => {
    it('returns null/undefined as is', () => {
      expect(sanitizeAccount(null)).toBeNull();
      expect(sanitizeAccount(undefined)).toBeUndefined();
    });
  });
}); 