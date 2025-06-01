import {
  buildMatchStage,
  buildFacetStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';
import {
  buildDemandForecastPipeline,
  buildPricingStrategyPipeline,
  buildResourceOptimizationPipeline,
  buildRiskMetricsPipeline
} from './lib/metrics-pipelines.js';

/**
 * Get predictive host insights (configurable, optimized).
 * @param {Object} deps - Dependencies: EventModel, ObjectId, withErrorHandling
 * @returns {Function} (hostId, options) => Promise<AnalyticsResult>
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getHostPredictiveInsights = ({ EventModel, ObjectId, withErrorHandling }) =>
  withErrorHandling(async (hostId, { metrics = null } = {}) => {
    validateAnalyticsInput({ requiredFields: ['hostId'] }, { hostId });
    const allMetrics = {
      demandForecast: buildDemandForecastPipeline(),
      pricingStrategy: buildPricingStrategyPipeline(),
      resourceOptimization: buildResourceOptimizationPipeline(),
      riskMetrics: buildRiskMetricsPipeline()
    };
    const facetMetrics = metrics
      ? Object.fromEntries(Object.entries(allMetrics).filter(([k]) => metrics.includes(k)))
      : allMetrics;
    const pipeline = [
      buildMatchStage({ hostId: new ObjectId(hostId) }),
      buildFacetStage(facetMetrics),
      { $project: { _id: 0 } }
    ];
    const [result] = await EventModel.aggregate(pipeline);
    return result;
  });

export default getHostPredictiveInsights; 