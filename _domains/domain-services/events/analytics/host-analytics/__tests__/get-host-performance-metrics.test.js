import getHostPerformanceMetrics from '../get-host-performance-metrics.js';

describe('getHostPerformanceMetrics', () => {
  const Host = { aggregate: jest.fn() };
  const context = { Host };

  it('returns host performance metrics (happy path)', async () => {
    // TODO: mock aggregate and assert result
  });

  it('handles empty results (edge case)', async () => {
    // TODO: mock aggregate to return []
  });

  it('throws on invalid input (failure case)', async () => {
    // TODO: call with missing dates and expect error
  });
}); 