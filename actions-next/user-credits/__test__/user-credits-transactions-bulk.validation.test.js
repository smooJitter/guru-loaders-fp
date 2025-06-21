import {
  bulkCreateTransactionsSchema,
  bulkExpireCreditsSchema,
  bulkTransferCreditsSchema
} from '../transactions/lib/user-credits-transaction-bulk.validation.js';

describe('transactions/bulk.validation.js', () => {
  it('validates bulkCreateTransactionsSchema (happy path)', async () => {
    const valid = { transactions: [{ userId: 'u1', amount: 10, type: 'top_up' }] };
    await expect(bulkCreateTransactionsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if transactions is empty (fail path)', async () => {
    const invalid = { transactions: [] };
    await expect(bulkCreateTransactionsSchema.validate(invalid)).rejects.toThrow(/transactions/);
  });
  it('accepts extra fields in transaction (edge case)', async () => {
    const valid = { transactions: [{ userId: 'u1', amount: 10, type: 'top_up', foo: 'bar' }] };
    await expect(bulkCreateTransactionsSchema.validate(valid)).resolves.toHaveProperty('transactions');
  });

  it('validates bulkExpireCreditsSchema (happy path)', async () => {
    const valid = { userIds: ['u1'], amount: 5 };
    await expect(bulkExpireCreditsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if userIds missing (fail path)', async () => {
    const invalid = { amount: 5 };
    await expect(bulkExpireCreditsSchema.validate(invalid)).rejects.toThrow(/userIds/);
  });

  it('validates bulkTransferCreditsSchema (happy path)', async () => {
    const valid = { fromUserId: 'u1', toUserIds: ['u2'], amountPerUser: 10 };
    await expect(bulkTransferCreditsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if toUserIds is empty (fail path)', async () => {
    const invalid = { fromUserId: 'u1', toUserIds: [], amountPerUser: 10 };
    await expect(bulkTransferCreditsSchema.validate(invalid)).rejects.toThrow(/toUserIds/);
  });
}); 