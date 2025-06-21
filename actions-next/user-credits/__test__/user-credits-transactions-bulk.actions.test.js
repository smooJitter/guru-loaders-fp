import * as actions from '../transactions/user-credits-transactions-bulk.actions.js';
import { createMockContext } from './context.mock.js';
import { jest } from '@jest/globals';
import { sanitizeTransaction } from '../transactions/user-credits-transactions-bulk.actions.js';

const { bulkCreateTransactions, bulkExpireCredits, bulkTransferCredits } = actions;

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['ADMIN'] },
  tenant: { id: 'test-tenant' },
  models: {
    CreditTransaction: {
      insertMany: jest.fn((txns) => Promise.resolve(txns.map((t, i) => ({ ...t, _id: `txn${i}` })) )),
    },
    CreditAccount: {
      startSession: jest.fn(() => ({
        withTransaction: async (fn) => await fn(),
        endSession: jest.fn()
      })),
      updateMany: jest.fn(() => Promise.resolve({ matchedCount: 2, modifiedCount: 2 })),
      findOneAndUpdate: jest.fn(() => ({
        lean: () => ({
          exec: () => Promise.resolve({ userId: 'fromUser', balance: 1000 })
        })
      })),
    },
    ...overrides.models
  },
  ...overrides
});

describe('user-credits-transactions-bulk.actions', () => {
  describe('bulkCreateTransactions', () => {
    it('should create multiple transactions (happy path)', async () => {
      const context = mockContext();
      const txns = [
        { userId: 'u1', amount: 10, type: 'top_up' },
        { userId: 'u2', amount: 20, type: 'spend' }
      ];
      const result = await bulkCreateTransactions({ context, transactions: txns });
      expect(result.count).toBe(2);
      expect(context.models.CreditTransaction.insertMany).toHaveBeenCalledWith(txns);
    });
    it('should fail validation for missing transactions', async () => {
      const context = mockContext();
      await expect(bulkCreateTransactions({ context })).rejects.toThrow();
    });
    it('should fail validation for empty transactions array', async () => {
      const context = mockContext();
      await expect(bulkCreateTransactions({ context, transactions: [] })).rejects.toThrow();
    });
  });

  describe('bulkExpireCredits', () => {
    it('should expire credits for multiple users (happy path)', async () => {
      const context = mockContext();
      const userIds = ['u1', 'u2'];
      const result = await bulkExpireCredits({ context, userIds, amount: 5, reason: 'test' });
      expect(result.matched).toBe(2);
      expect(result.modified).toBe(2);
      expect(context.models.CreditAccount.updateMany).toHaveBeenCalled();
      expect(context.models.CreditTransaction.insertMany).toHaveBeenCalled();
    });
    it('should fail validation for missing userIds', async () => {
      const context = mockContext();
      await expect(bulkExpireCredits({ context, amount: 5 })).rejects.toThrow();
    });
    it('should fail validation for missing amount', async () => {
      const context = mockContext();
      await expect(bulkExpireCredits({ context, userIds: ['u1', 'u2'] })).rejects.toThrow();
    });
  });

  describe('bulkTransferCredits', () => {
    it('should transfer credits from one user to many (happy path)', async () => {
      const context = mockContext();
      const fromUserId = 'fromUser';
      const toUserIds = ['u1', 'u2'];
      const amountPerUser = 100;
      const result = await bulkTransferCredits({ context, fromUserId, toUserIds, amountPerUser, description: 'test' });
      expect(result.fromUser.userId).toBe(fromUserId);
      expect(result.recipients).toBe(2);
      expect(result.amountPerUser).toBe(100);
      expect(result.totalAmount).toBe(200);
      expect(context.models.CreditAccount.findOneAndUpdate).toHaveBeenCalled();
      expect(context.models.CreditAccount.updateMany).toHaveBeenCalled();
      expect(context.models.CreditTransaction.insertMany).toHaveBeenCalled();
    });
    it('should fail validation for missing fromUserId', async () => {
      const context = mockContext();
      await expect(bulkTransferCredits({ context, toUserIds: ['u1'], amountPerUser: 10 })).rejects.toThrow();
    });
    it('should fail validation for missing toUserIds', async () => {
      const context = mockContext();
      await expect(bulkTransferCredits({ context, fromUserId: 'fromUser', amountPerUser: 10 })).rejects.toThrow();
    });
    it('should fail validation for missing amountPerUser', async () => {
      const context = mockContext();
      await expect(bulkTransferCredits({ context, fromUserId: 'fromUser', toUserIds: ['u1'] })).rejects.toThrow();
    });
    it('should fail if sender has insufficient credits (fail path)', async () => {
      const context = mockContext({
        models: {
          CreditAccount: {
            ...mockContext().models.CreditAccount,
            findOneAndUpdate: jest.fn(() => ({
              lean: () => ({
                exec: () => Promise.resolve(null) // Simulate insufficient credits
              })
            })),
            startSession: mockContext().models.CreditAccount.startSession
          },
          CreditTransaction: mockContext().models.CreditTransaction
        }
      });
      await expect(bulkTransferCredits({ context, fromUserId: 'fromUser', toUserIds: ['u1'], amountPerUser: 100 })).rejects.toThrow('Insufficient credits');
    });
  });

  // Composability test: ensure actions can be composed in a functional pipeline
  it('should allow composing bulk actions (composability)', async () => {
    const context = mockContext();
    const txns = [
      { userId: 'u1', amount: 10, type: 'top_up' },
      { userId: 'u2', amount: 20, type: 'spend' }
    ];
    const expireInput = { userIds: ['u1', 'u2'], amount: 5 };
    const transferInput = { fromUserId: 'u1', toUserIds: ['u2'], amountPerUser: 5 };
    // Compose: create, expire, transfer
    const createResult = await bulkCreateTransactions({ context, transactions: txns });
    const expireResult = await bulkExpireCredits({ context, ...expireInput });
    const transferResult = await bulkTransferCredits({ context, ...transferInput });
    expect(createResult.count).toBe(2);
    expect(expireResult.matched).toBeGreaterThanOrEqual(0);
    expect(transferResult.recipients).toBe(1);
  });

  describe('coverage edge cases', () => {
    it('sanitizeTransaction returns null/undefined as is', () => {
      expect(sanitizeTransaction(null)).toBeNull();
      expect(sanitizeTransaction(undefined)).toBeUndefined();
    });

    it('should use fallback description if not provided (bulkTransferCredits)', async () => {
      const context = mockContext();
      const fromUserId = 'fromUser';
      const toUserIds = ['u1', 'u2'];
      const amountPerUser = 100;
      const result = await bulkTransferCredits({ context, fromUserId, toUserIds, amountPerUser });
      const call = context.models.CreditTransaction.insertMany.mock.calls[0][0][0];
      expect(call.description).toMatch(/Bulk transferred/);
      const receiverCall = context.models.CreditTransaction.insertMany.mock.calls[0][0][1];
      expect(receiverCall.description).toMatch(/Received/);
    });

    it('should use fallback description if not provided (bulkExpireCredits)', async () => {
      const context = mockContext();
      const userIds = ['u1', 'u2'];
      await bulkExpireCredits({ context, userIds, amount: 5 });
      const call = context.models.CreditTransaction.insertMany.mock.calls[0][0][0];
      expect(call.description).toMatch(/Credits expired/);
    });

    it('should throw and still call endSession if withTransaction throws (bulkExpireCredits)', async () => {
      const endSession = jest.fn();
      const context = mockContext({
        models: {
          CreditAccount: {
            ...mockContext().models.CreditAccount,
            startSession: jest.fn(() => ({
              withTransaction: async () => { throw new Error('DB error'); },
              endSession
            })),
          },
          CreditTransaction: mockContext().models.CreditTransaction
        }
      });
      await expect(bulkExpireCredits({ context, userIds: ['u1'], amount: 5 })).rejects.toThrow('DB error');
      expect(endSession).toHaveBeenCalled();
    });

    it('should throw and still call endSession if withTransaction throws (bulkTransferCredits)', async () => {
      const endSession = jest.fn();
      const context = mockContext({
        models: {
          CreditAccount: {
            ...mockContext().models.CreditAccount,
            startSession: jest.fn(() => ({
              withTransaction: async () => { throw new Error('DB error'); },
              endSession
            })),
          },
          CreditTransaction: mockContext().models.CreditTransaction
        }
      });
      await expect(bulkTransferCredits({ context, fromUserId: 'fromUser', toUserIds: ['u1'], amountPerUser: 5 })).rejects.toThrow('DB error');
      expect(endSession).toHaveBeenCalled();
    });

    it('should fail validation for empty toUserIds in bulkTransferCredits', async () => {
      const context = mockContext();
      await expect(bulkTransferCredits({ context, fromUserId: 'fromUser', toUserIds: [], amountPerUser: 5 })).rejects.toThrow();
    });
  });

  describe('sanitizeTransaction', () => {
    it('returns null if input is null', () => {
      expect(sanitizeTransaction(null)).toBeNull();
    });
    it('returns undefined if input is undefined', () => {
      expect(sanitizeTransaction(undefined)).toBeUndefined();
    });
    it('removes __v from object', () => {
      expect(sanitizeTransaction({ foo: 1, __v: 2 })).toEqual({ foo: 1 });
    });
  });
}); 