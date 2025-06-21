import actions from '../transactions/user-credits-transactions-query.actions.js';
import { createMockContext } from './context.mock.js';

let actionsArr;
let getTransactionsByUser, listTransactionsByType, getCreditBalanceHistory, getTransactionStats, searchTransactions;
beforeAll(async () => {
  actionsArr = typeof actions === 'function' ? await actions() : actions;
  getTransactionsByUser = actionsArr.find(a => a.name === 'getTransactionsByUser').method;
  listTransactionsByType = actionsArr.find(a => a.name === 'listTransactionsByType').method;
  getCreditBalanceHistory = actionsArr.find(a => a.name === 'getCreditBalanceHistory').method;
  getTransactionStats = actionsArr.find(a => a.name === 'getTransactionStats').method;
  searchTransactions = actionsArr.find(a => a.name === 'searchTransactions').method;
});

const mockTxn = (overrides = {}) => ({ _id: 'txn1', userId: 'u1', type: 'top_up', amount: 10, balance: 100, createdAt: new Date(), ...overrides });

const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['USER'] },
  tenant: { id: 'test-tenant' },
  models: {
    CreditTransaction: {
      find: jest.fn(() => ({
        sort: jest.fn(() => ({
          skip: jest.fn(() => ({
            limit: jest.fn(() => ({
              lean: jest.fn(() => ({
                exec: jest.fn(() => Promise.resolve([mockTxn()]))
              }))
            }))
          }))
        }))
      })),
      countDocuments: jest.fn(() => Promise.resolve(1)),
      aggregate: jest.fn(() => Promise.resolve([{ _id: '2024-06-09', lastBalance: 100, lastTxn: mockTxn() }])),
    },
    ...overrides.models
  },
  ...overrides
});

describe('user-credits-transactions-query.actions', () => {
  describe('getTransactionsByUser', () => {
    it('should return transactions for a user (happy path)', async () => {
      const context = mockContext();
      const result = await getTransactionsByUser({ context, userId: 'u1' });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });
    it('should fail with missing userId (failure path)', async () => {
      const context = mockContext();
      await expect(getTransactionsByUser({ context })).rejects.toThrow('Invalid input');
    });
    it('should handle edge case: no transactions', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            find: jest.fn(() => ({
              sort: jest.fn(() => ({
                skip: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    lean: jest.fn(() => ({
                      exec: jest.fn(() => Promise.resolve([]))
                    }))
                  }))
                }))
              }))
            })),
            countDocuments: jest.fn(() => Promise.resolve(0)),
          }
        }
      });
      const result = await getTransactionsByUser({ context, userId: 'u1' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('listTransactionsByType', () => {
    it('should return transactions by type (happy path)', async () => {
      const context = mockContext();
      const result = await listTransactionsByType({ context, type: 'top_up' });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('should fail with missing type (failure path)', async () => {
      const context = mockContext();
      await expect(listTransactionsByType({ context })).rejects.toThrow('Invalid input');
    });
    it('should handle edge case: no transactions of type', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            find: jest.fn(() => ({
              sort: jest.fn(() => ({
                skip: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    lean: jest.fn(() => ({
                      exec: jest.fn(() => Promise.resolve([]))
                    }))
                  }))
                }))
              }))
            })),
            countDocuments: jest.fn(() => Promise.resolve(0)),
          }
        }
      });
      const result = await listTransactionsByType({ context, type: 'refund' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getCreditBalanceHistory', () => {
    it('should return balance history (happy path)', async () => {
      const context = mockContext();
      const result = await getCreditBalanceHistory({ context, userId: 'u1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('balance');
    });
    it('should fail with missing userId (failure path)', async () => {
      const context = mockContext();
      await expect(getCreditBalanceHistory({ context })).rejects.toThrow('Invalid input');
    });
    it('should handle edge case: no history', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            aggregate: jest.fn(() => Promise.resolve([])),
          }
        }
      });
      const result = await getCreditBalanceHistory({ context, userId: 'u1' });
      expect(result).toHaveLength(0);
    });
  });

  describe('getTransactionStats', () => {
    it('should return stats (happy path)', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            aggregate: jest.fn(() => Promise.resolve([{ _id: 'top_up', total: 100, count: 2 }]))
          }
        }
      });
      const result = await getTransactionStats({ context, userId: 'u1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('total');
    });
    it('should fail with missing userId (failure path)', async () => {
      const context = mockContext();
      await expect(getTransactionStats({ context })).rejects.toThrow('Invalid input');
    });
    it('should handle edge case: no stats', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            aggregate: jest.fn(() => Promise.resolve([]))
          }
        }
      });
      const result = await getTransactionStats({ context, userId: 'u1' });
      expect(result).toHaveLength(0);
    });
  });

  describe('searchTransactions', () => {
    it('should return search results (happy path)', async () => {
      const context = mockContext();
      const result = await searchTransactions({ context, query: 'top up' });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('should fail with missing query (failure path)', async () => {
      const context = mockContext();
      await expect(searchTransactions({ context })).rejects.toThrow('Invalid input');
    });
    it('should handle edge case: no results', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            find: jest.fn(() => ({
              sort: jest.fn(() => ({
                skip: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    lean: jest.fn(() => ({
                      exec: jest.fn(() => Promise.resolve([]))
                    }))
                  }))
                }))
              }))
            })),
            countDocuments: jest.fn(() => Promise.resolve(0)),
          }
        }
      });
      const result = await searchTransactions({ context, query: 'refund' });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // Composability test: get user transactions, then stats
  describe('composability', () => {
    it('should allow composing getTransactionsByUser and getTransactionStats', async () => {
      const context = mockContext();
      const txns = await getTransactionsByUser({ context, userId: 'u1' });
      const stats = await getTransactionStats({ context, userId: 'u1' });
      expect(txns.items).toBeDefined();
      expect(stats).toBeDefined();
    });
  });

  describe('getCreditBalanceHistory (branch coverage)', () => {
    it('should handle only startDate', async () => {
      const context = mockContext();
      await expect(getCreditBalanceHistory({ context, userId: 'u1', startDate: '2024-01-01' })).resolves.toBeDefined();
    });
    it('should handle only endDate', async () => {
      const context = mockContext();
      await expect(getCreditBalanceHistory({ context, userId: 'u1', endDate: '2024-12-31' })).resolves.toBeDefined();
    });
    it('should handle both startDate and endDate', async () => {
      const context = mockContext();
      await expect(getCreditBalanceHistory({ context, userId: 'u1', startDate: '2024-01-01', endDate: '2024-12-31' })).resolves.toBeDefined();
    });
    it('should handle interval = "week"', async () => {
      const context = mockContext();
      await expect(getCreditBalanceHistory({ context, userId: 'u1', interval: 'week' })).resolves.toBeDefined();
    });
    it('should handle interval = "month"', async () => {
      const context = mockContext();
      await expect(getCreditBalanceHistory({ context, userId: 'u1', interval: 'month' })).resolves.toBeDefined();
    });
  });

  describe('getTransactionStats (branch coverage)', () => {
    it('should handle only startDate', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            aggregate: jest.fn(() => Promise.resolve([]))
          }
        }
      });
      await expect(getTransactionStats({ context, userId: 'u1', startDate: '2024-01-01' })).resolves.toBeDefined();
    });
    it('should handle only endDate', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            aggregate: jest.fn(() => Promise.resolve([]))
          }
        }
      });
      await expect(getTransactionStats({ context, userId: 'u1', endDate: '2024-12-31' })).resolves.toBeDefined();
    });
    it('should handle both startDate and endDate', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            aggregate: jest.fn(() => Promise.resolve([]))
          }
        }
      });
      await expect(getTransactionStats({ context, userId: 'u1', startDate: '2024-01-01', endDate: '2024-12-31' })).resolves.toBeDefined();
    });
  });

  describe('searchTransactions (branch coverage)', () => {
    it('should match on description', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            find: jest.fn(() => ({
              sort: jest.fn(() => ({
                skip: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    lean: jest.fn(() => ({
                      exec: jest.fn(() => Promise.resolve([mockTxn({ description: 'desc match' })]))
                    }))
                  }))
                }))
              }))
            })),
            countDocuments: jest.fn(() => Promise.resolve(1)),
          }
        }
      });
      const result = await searchTransactions({ context, query: 'desc match' });
      expect(result.items[0].description).toBe('desc match');
    });
    it('should match on referenceId', async () => {
      const context = mockContext({
        models: {
          CreditTransaction: {
            ...mockContext().models.CreditTransaction,
            find: jest.fn(() => ({
              sort: jest.fn(() => ({
                skip: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    lean: jest.fn(() => ({
                      exec: jest.fn(() => Promise.resolve([mockTxn({ referenceId: 'ref123' })]))
                    }))
                  }))
                }))
              }))
            })),
            countDocuments: jest.fn(() => Promise.resolve(1)),
          }
        }
      });
      const result = await searchTransactions({ context, query: 'ref123' });
      expect(result.items[0].referenceId).toBe('ref123');
    });
  });
}); 