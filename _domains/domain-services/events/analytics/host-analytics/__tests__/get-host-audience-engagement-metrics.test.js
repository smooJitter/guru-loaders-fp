import getHostAudienceEngagementMetrics from '../get-host-audience-engagement-metrics.js';

describe('getHostAudienceEngagementMetrics', () => {
  const Host = { aggregate: jest.fn() };
  const context = { Host };

  it('returns host audience engagement metrics (happy path)', async () => {
    // TODO: mock aggregate and assert result
  });

  it('handles empty results (edge case)', async () => {
    // TODO: mock aggregate to return []
  });

  it('throws on invalid input (failure case)', async () => {
    // TODO: call with missing dates and expect error
  });
}); 