import { analyticsQuerySchema } from '../analytics/validation.js';

describe('analytics/validation.js', () => {
  it('validates correct input (happy path)', async () => {
    const valid = { userId: 'u1', startDate: '2024-01-01', endDate: '2024-12-31' };
    const result = await analyticsQuerySchema.validate(valid);
    expect(result.userId).toBe('u1');
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.startDate.toISOString().slice(0, 10)).toBe('2024-01-01');
    expect(result.endDate.toISOString().slice(0, 10)).toBe('2024-12-31');
  });

  it('fails if userId is missing (fail path)', async () => {
    const invalid = { startDate: '2024-01-01' };
    await expect(analyticsQuerySchema.validate(invalid)).rejects.toThrow(/userId/);
  });

  it('accepts missing dates (edge case)', async () => {
    const valid = { userId: 'u1' };
    await expect(analyticsQuerySchema.validate(valid)).resolves.toMatchObject(valid);
  });

  it('rejects invalid date (fail path)', async () => {
    const invalid = { userId: 'u1', startDate: 'not-a-date' };
    await expect(analyticsQuerySchema.validate(invalid)).rejects.toThrow(/startDate/);
  });

  it('ignores extra fields (edge case)', async () => {
    const valid = { userId: 'u1', foo: 'bar' };
    await expect(analyticsQuerySchema.validate(valid)).resolves.toHaveProperty('userId', 'u1');
  });
}); 