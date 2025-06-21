import { accountUpdateSchema } from '../account/validation.js';

describe('account/validation.js', () => {
  it('validates correct input (happy path)', async () => {
    const valid = { userId: 'u1', email: 'test@example.com', balance: 100 };
    await expect(accountUpdateSchema.validate(valid)).resolves.toMatchObject(valid);
  });

  it('fails if userId is missing (fail path)', async () => {
    const invalid = { email: 'test@example.com' };
    await expect(accountUpdateSchema.validate(invalid)).rejects.toThrow(/userId/);
  });

  it('rejects invalid email (fail path)', async () => {
    const invalid = { userId: 'u1', email: 'not-an-email' };
    await expect(accountUpdateSchema.validate(invalid)).rejects.toThrow(/email/);
  });

  it('accepts missing balance (edge case)', async () => {
    const valid = { userId: 'u1', email: 'test@example.com' };
    await expect(accountUpdateSchema.validate(valid)).resolves.toMatchObject(valid);
  });

  it('accepts negative balance (edge case)', async () => {
    const valid = { userId: 'u1', balance: -50 };
    await expect(accountUpdateSchema.validate(valid)).resolves.toMatchObject(valid);
  });

  it('ignores extra fields (edge case)', async () => {
    const valid = { userId: 'u1', foo: 'bar' };
    await expect(accountUpdateSchema.validate(valid)).resolves.toHaveProperty('userId', 'u1');
  });
}); 