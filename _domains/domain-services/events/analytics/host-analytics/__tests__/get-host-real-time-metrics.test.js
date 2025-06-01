import getHostRealTimeMetrics from '../get-host-real-time-metrics.js';

describe('getHostRealTimeMetrics', () => {
  const Host = { aggregate: jest.fn() };
  const context = { Host };

  it('returns host real-time metrics (happy path)', async () => {
    // TODO: mock aggregate and assert result
  });

  it('handles empty results (edge case)', async () => {
    // TODO: mock aggregate to return []
  });

  it('throws on invalid input (failure case)', async () => {
    // TODO: call with missing dates and expect error
  });
}); 