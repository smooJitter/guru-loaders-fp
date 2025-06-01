import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';
import {
  buildEventMetricsPipeline,
  buildAudienceGrowthPipeline,
  buildOperationalMetricsPipeline,
  buildMarketingMetricsPipeline
} from './lib/metrics-pipelines.js';

/**
 * Get comprehensive host performance metrics (configurable, optimized).
 * @param {Object} deps - Dependencies: EventModel, ObjectId, withErrorHandling
 * @returns {Function} (hostId, startDate, endDate, options) => Promise<AnalyticsResult>
 * @param {string} [options.dateField='createdAt'] - Date field to filter on
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getHostPerformanceMetrics = ({ EventModel, ObjectId, withErrorHandling }) =>
  withErrorHandling(async (hostId, startDate, endDate, { dateField = 'createdAt', metrics = null } = {}) => {
    validateAnalyticsInput({ requiredFields: ['hostId', 'startDate', 'endDate'], dateFields: ['startDate', 'endDate'] }, { hostId, startDate, endDate });
    const timeWindow = createFieldTimeWindow({ field: dateField, from: startDate, to: endDate });

    const allMetrics = {
      eventMetrics: buildEventMetricsPipeline(),
      audienceGrowth: buildAudienceGrowthPipeline(),
      operationalMetrics: buildOperationalMetricsPipeline(),
      marketingMetrics: buildMarketingMetricsPipeline()
    };
    const facetMetrics = metrics
      ? Object.fromEntries(Object.entries(allMetrics).filter(([k]) => metrics.includes(k)))
      : allMetrics;

    const pipeline = [
      buildMatchStage({ hostId: new ObjectId(hostId), ...timeWindow }),
      buildFacetStage(facetMetrics),
      { $project: { _id: 0 } }
    ];
    const [result] = await EventModel.aggregate(pipeline);
    return result;
  });

export default getHostPerformanceMetrics; 