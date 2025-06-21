import actions from '../transactions/user-credits-transactions-mutation.actions.js';
import { createMockContext } from './context.mock.js';
console.log('Loaded actions:', actions);
if (!actions || !Array.isArray(actions)) {
  throw new Error('Actions array not loaded from user-credits-transactions-mutation.actions.js');
}

let actionsArr;
let createCreditTransaction, creditTopUp, spendCredits, refundCredits, expireCredits, transferCredits;
beforeAll(async () => {
  actionsArr = typeof actions === 'function' ? await actions() : actions;
  createCreditTransaction = actionsArr.find(a => a.name === 'createCreditTransaction').method;
  creditTopUp = actionsArr.find(a => a.name === 'creditTopUp').method;
  spendCredits = actionsArr.find(a => a.name === 'spendCredits').method;
  refundCredits = actionsArr.find(a => a.name === 'refundCredits').method;
  expireCredits = actionsArr.find(a => a.name === 'expireCredits').method;
  transferCredits = actionsArr.find(a => a.name === 'transferCredits').method;
});

const mockAccount = { balance: 100 };
const mockContext = () => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    CreditTransaction: {
      create: jest.fn((data) => ({ toObject: () => ({ ...data, _id: 'txn1' }) })),
    },
    CreditAccount: {
      findOneAndUpdate: jest.fn(() => ({
        lean: () => ({
          exec: () => Promise.resolve(mockAccount)
        })
      })),
      startSession: jest.fn(() => ({
        withTransaction: async (fn) => await fn(),
        endSession: jest.fn()
      })),
    },
  },
});

describe('user-credits-transactions-mutation.actions', () => {
  const assertContextModels = (context) => {
    if (!context.models || !context.models.CreditAccount || !context.models.CreditTransaction) {
      // eslint-disable-next-line no-console
      console.error('Context models missing:', context.models);
      throw new Error('Test context is missing required models');
    }
  };

  describe('createCreditTransaction', () => {
    it('should create a transaction (happy path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      const result = await createCreditTransaction({ context, userId: 'u1', amount: 10, type: 'top_up' });
      expect(result.userId).toBe('u1');
      expect(result.amount).toBe(10);
    });
    it('should fail with missing fields (failure path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(createCreditTransaction({ context, amount: 10, type: 'top_up' })).rejects.toThrow();
    });
    it('should handle edge case: amount zero', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(createCreditTransaction({ context, userId: 'u1', amount: 0, type: 'top_up' })).resolves.toBeDefined();
    });
    it('throws if context or models is missing (fail path)', async () => {
      await expect(createCreditTransaction({})).rejects.toThrow();
      await expect(createCreditTransaction({ context: {} })).rejects.toThrow();
      await expect(createCreditTransaction({ context: { models: {} } })).rejects.toThrow();
    });
    it('throws if CreditTransaction.create throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(createCreditTransaction({ context, userId: 'u1', amount: 10, type: 'top_up' })).rejects.toThrow('DB error');
    });
    it('returns null if sanitizeTransaction gets null (edge case)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockResolvedValue({ toObject: () => null });
      const result = await createCreditTransaction({ context, userId: 'u1', amount: 10, type: 'top_up' });
      expect(result).toBeNull();
    });
    it('throws on validation error (fail path)', async () => {
      const context = mockContext();
      await expect(createCreditTransaction({ context, userId: 123, amount: 'not-a-number', type: 42 })).rejects.toThrow();
    });
    it('throws with specific error if userId, amount, or type is missing', async () => {
      const context = mockContext();
      await expect(createCreditTransaction({ context, amount: 10, type: 'top_up' })).rejects.toThrow(/userId is a required field/);
      await expect(createCreditTransaction({ context, userId: 'u1', type: 'top_up' })).rejects.toThrow(/amount is a required field/);
      await expect(createCreditTransaction({ context, userId: 'u1', amount: 10 })).rejects.toThrow(/type is a required field/);
    });
  });

  describe('creditTopUp', () => {
    it('should top up credits (happy path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      const result = await creditTopUp({ context, userId: 'u1', amount: 50 });
      expect(result).toBe(100);
    });
    it('should fail with missing userId (failure path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(creditTopUp({ context, amount: 50 })).rejects.toThrow();
    });
    it('should handle edge case: amount negative', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(creditTopUp({ context, userId: 'u1', amount: -10 })).resolves.toBeDefined();
    });
    it('throws if context or models is missing (fail path)', async () => {
      await expect(creditTopUp({})).rejects.toThrow();
      await expect(creditTopUp({ context: {} })).rejects.toThrow();
      await expect(creditTopUp({ context: { models: {} } })).rejects.toThrow();
    });
    it('throws if CreditTransaction.create throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(creditTopUp({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws if CreditAccount.findOneAndUpdate throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.reject(new Error('DB error')) })
      }));
      await expect(creditTopUp({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws on validation error (fail path)', async () => {
      const context = mockContext();
      await expect(creditTopUp({ context, userId: 123, amount: 'not-a-number' })).rejects.toThrow();
    });
    it('throws with specific error if userId is empty or amount is not a number', async () => {
      const context = mockContext();
      await expect(creditTopUp({ context, userId: '', amount: 10 })).rejects.toThrow(/userId is a required field/);
      await expect(creditTopUp({ context, userId: 'u1', amount: 'foo' })).rejects.toThrow(/amount must be a .*number/);
    });
  });

  describe('spendCredits', () => {
    it('should spend credits (happy path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      const result = await spendCredits({ context, userId: 'u1', amount: 10 });
      expect(result).toBe(100);
    });
    it('should fail if insufficient credits (failure path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.resolve(null) })
      }));
      assertContextModels(context);
      await expect(spendCredits({ context, userId: 'u1', amount: 1000 })).rejects.toThrow('Insufficient credits');
    });
    it('should handle edge case: amount zero', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(spendCredits({ context, userId: 'u1', amount: 0 })).resolves.toBeDefined();
    });
    it('throws if context or models is missing (fail path)', async () => {
      await expect(spendCredits({})).rejects.toThrow();
      await expect(spendCredits({ context: {} })).rejects.toThrow();
      await expect(spendCredits({ context: { models: {} } })).rejects.toThrow();
    });
    it('throws if CreditAccount.findOneAndUpdate throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.reject(new Error('DB error')) })
      }));
      await expect(spendCredits({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws if CreditTransaction.create throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(spendCredits({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws on validation error (fail path)', async () => {
      const context = mockContext();
      await expect(spendCredits({ context, userId: 123, amount: 'not-a-number' })).rejects.toThrow();
    });
    it('throws with specific error if userId is empty or amount is not a number', async () => {
      const context = mockContext();
      await expect(spendCredits({ context, userId: '', amount: 10 })).rejects.toThrow(/userId is a required field/);
      await expect(spendCredits({ context, userId: 'u1', amount: 'foo' })).rejects.toThrow(/amount must be a .*number/);
    });
  });

  describe('refundCredits', () => {
    it('should refund credits (happy path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      const result = await refundCredits({ context, userId: 'u1', amount: 10 });
      expect(result).toBe(100);
    });
    it('should fail with missing userId (failure path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(refundCredits({ context, amount: 10 })).rejects.toThrow();
    });
    it('should handle edge case: amount negative', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(refundCredits({ context, userId: 'u1', amount: -10 })).resolves.toBeDefined();
    });
    it('throws if context or models is missing (fail path)', async () => {
      await expect(refundCredits({})).rejects.toThrow();
      await expect(refundCredits({ context: {} })).rejects.toThrow();
      await expect(refundCredits({ context: { models: {} } })).rejects.toThrow();
    });
    it('throws if CreditTransaction.create throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(refundCredits({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws if CreditAccount.findOneAndUpdate throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.reject(new Error('DB error')) })
      }));
      await expect(refundCredits({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws on validation error (fail path)', async () => {
      const context = mockContext();
      await expect(refundCredits({ context, userId: 123, amount: 'not-a-number' })).rejects.toThrow();
    });
    it('throws with specific error if userId is empty or amount is not a number', async () => {
      const context = mockContext();
      await expect(refundCredits({ context, userId: '', amount: 10 })).rejects.toThrow(/userId is a required field/);
      await expect(refundCredits({ context, userId: 'u1', amount: 'foo' })).rejects.toThrow(/amount must be a .*number/);
    });
  });

  describe('expireCredits', () => {
    it('should expire credits (happy path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      const result = await expireCredits({ context, userId: 'u1', amount: 10 });
      expect(result).toBe(100);
    });
    it('should fail if insufficient credits (failure path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.resolve(null) })
      }));
      assertContextModels(context);
      await expect(expireCredits({ context, userId: 'u1', amount: 1000 })).rejects.toThrow('Insufficient credits');
    });
    it('should handle edge case: amount zero', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(expireCredits({ context, userId: 'u1', amount: 0 })).resolves.toBeDefined();
    });
    it('throws if context or models is missing (fail path)', async () => {
      await expect(expireCredits({})).rejects.toThrow();
      await expect(expireCredits({ context: {} })).rejects.toThrow();
      await expect(expireCredits({ context: { models: {} } })).rejects.toThrow();
    });
    it('throws if CreditAccount.findOneAndUpdate throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.reject(new Error('DB error')) })
      }));
      await expect(expireCredits({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws if CreditTransaction.create throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(expireCredits({ context, userId: 'u1', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws on validation error (fail path)', async () => {
      const context = mockContext();
      await expect(expireCredits({ context, userId: 123, amount: 'not-a-number' })).rejects.toThrow();
    });
    it('throws with specific error if userId is empty or amount is not a number', async () => {
      const context = mockContext();
      await expect(expireCredits({ context, userId: '', amount: 10 })).rejects.toThrow(/userId is a required field/);
      await expect(expireCredits({ context, userId: 'u1', amount: 'foo' })).rejects.toThrow(/amount must be a .*number/);
    });
  });

  describe('transferCredits', () => {
    it('should transfer credits (happy path)', async () => {
      const context = mockContext();
      assertContextModels(context);
      const result = await transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 10 });
      expect(result.fromUser.userId).toBe('u1');
      expect(result.toUser.userId).toBe('u2');
    });
    it('should fail if insufficient credits (failure path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn((query) => ({
        lean: () => ({ exec: () => Promise.resolve(query.userId === 'u1' ? null : { balance: 100 }) })
      }));
      assertContextModels(context);
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 1000 })).rejects.toThrow('Insufficient credits');
    });
    it('should handle edge case: amount zero', async () => {
      const context = mockContext();
      assertContextModels(context);
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 0 })).resolves.toBeDefined();
    });
    it('throws if context or models is missing (fail path)', async () => {
      await expect(transferCredits({})).rejects.toThrow();
      await expect(transferCredits({ context: {} })).rejects.toThrow();
      await expect(transferCredits({ context: { models: {} } })).rejects.toThrow();
    });
    it('throws if CreditAccount.findOneAndUpdate throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.findOneAndUpdate = jest.fn(() => ({
        lean: () => ({ exec: () => Promise.reject(new Error('DB error')) })
      }));
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws if CreditTransaction.create throws (fail path)', async () => {
      const context = mockContext();
      context.models.CreditTransaction.create = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 10 })).rejects.toThrow('DB error');
    });
    it('throws on validation error (fail path)', async () => {
      const context = mockContext();
      await expect(transferCredits({ context, fromUserId: 123, toUserId: 456, amount: 'not-a-number' })).rejects.toThrow();
    });
    it('throws with specific error if fromUserId, toUserId is empty or amount is not a number', async () => {
      const context = mockContext();
      await expect(transferCredits({ context, fromUserId: '', toUserId: 'u2', amount: 10 })).rejects.toThrow(/fromUserId is a required field/);
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: '', amount: 10 })).rejects.toThrow(/toUserId is a required field/);
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 'foo' })).rejects.toThrow(/amount must be a .*number/);
    });
    it('throws if session fails (session error path)', async () => {
      const context = mockContext();
      context.models.CreditAccount.startSession = jest.fn(() => ({
        withTransaction: async () => { throw new Error('Session failed'); },
        endSession: jest.fn()
      }));
      await expect(transferCredits({ context, fromUserId: 'u1', toUserId: 'u2', amount: 10 })).rejects.toThrow('Session failed');
    });
  });

  // Higher-order/composability test
  describe('composability', () => {
    it('should allow composing actions (e.g., top up then spend)', async () => {
      const context = mockContext();
      assertContextModels(context);
      await creditTopUp({ context, userId: 'u1', amount: 50 });
      const result = await spendCredits({ context, userId: 'u1', amount: 10 });
      expect(result).toBe(100);
    });
  });
}); 