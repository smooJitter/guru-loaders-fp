import {
  creditTransactionSchema,
  creditTopUpSchema,
  spendCreditsSchema,
  refundCreditsSchema,
  expireCreditsSchema,
  transferCreditsSchema
} from '../transactions/lib/user-credits-transactions-mutation.validation.js';

describe('transactions/mutation.validation.js', () => {
  it('validates creditTransactionSchema (happy path)', async () => {
    const valid = { userId: 'u1', amount: 10, type: 'top_up' };
    await expect(creditTransactionSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if userId missing (fail path)', async () => {
    const invalid = { amount: 10, type: 'top_up' };
    await expect(creditTransactionSchema.validate(invalid)).rejects.toThrow(/userId/);
  });
  it('accepts extra fields (edge case)', async () => {
    const valid = { userId: 'u1', amount: 10, type: 'top_up', foo: 'bar' };
    await expect(creditTransactionSchema.validate(valid)).resolves.toHaveProperty('userId', 'u1');
  });

  it('validates creditTopUpSchema (happy path)', async () => {
    const valid = { userId: 'u1', amount: 10 };
    await expect(creditTopUpSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if amount missing (fail path)', async () => {
    const invalid = { userId: 'u1' };
    await expect(creditTopUpSchema.validate(invalid)).rejects.toThrow(/amount/);
  });

  it('validates spendCreditsSchema (happy path)', async () => {
    const valid = { userId: 'u1', amount: 5 };
    await expect(spendCreditsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if amount is not a number (fail path)', async () => {
    const invalid = { userId: 'u1', amount: 'not-a-number' };
    await expect(spendCreditsSchema.validate(invalid)).rejects.toThrow(/amount/);
  });

  it('validates refundCreditsSchema (happy path)', async () => {
    const valid = { userId: 'u1', amount: 5 };
    await expect(refundCreditsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if userId missing (fail path)', async () => {
    const invalid = { amount: 5 };
    await expect(refundCreditsSchema.validate(invalid)).rejects.toThrow(/userId/);
  });

  it('validates expireCreditsSchema (happy path)', async () => {
    const valid = { userId: 'u1', amount: 1 };
    await expect(expireCreditsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if amount missing (fail path)', async () => {
    const invalid = { userId: 'u1' };
    await expect(expireCreditsSchema.validate(invalid)).rejects.toThrow(/amount/);
  });

  it('validates transferCreditsSchema (happy path)', async () => {
    const valid = { fromUserId: 'u1', toUserId: 'u2', amount: 10 };
    await expect(transferCreditsSchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('fails if toUserId missing (fail path)', async () => {
    const invalid = { fromUserId: 'u1', amount: 10 };
    await expect(transferCreditsSchema.validate(invalid)).rejects.toThrow(/toUserId/);
  });
}); 