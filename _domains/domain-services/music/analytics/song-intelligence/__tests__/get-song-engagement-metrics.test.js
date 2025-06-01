import getSongEngagementMetrics from '../get-song-engagement-metrics.js';

describe('getSongEngagementMetrics', () => {
  const Song = { aggregate: jest.fn() };
  const context = { Song };

  it('returns song engagement metrics (happy path)', async () => {
    // TODO: mock aggregate and assert result
  });

  it('handles empty results (edge case)', async () => {
    // TODO: mock aggregate to return []
  });

  it('throws on invalid input (failure case)', async () => {
    // TODO: call with missing dates and expect error
  });
}); 