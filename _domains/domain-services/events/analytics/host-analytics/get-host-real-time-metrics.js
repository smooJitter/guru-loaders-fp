import {
  createFieldTimeWindow,
  buildMatchStage,
  buildFacetStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';
import {
  buildAttendanceFlowPipeline,
  buildZoneMetricsPipeline,
  buildServiceMetricsPipeline,
  buildSecurityMetricsPipeline
} from './lib/metrics-pipelines.js';

/**
 * Get real-time host metrics (configurable, optimized).
 * @param {Object} deps - Dependencies: EventModel, ObjectId, withErrorHandling
 * @returns {Function} (hostId, eventId, options) => Promise<AnalyticsResult>
 * @param {number} [options.hours=1] - Time window in hours (default: 1)
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getHostRealTimeMetrics = ({ EventModel, ObjectId, withErrorHandling }) =>
  withErrorHandling(async (hostId, eventId, { hours = 1, metrics = null } = {}) => {
    validateAnalyticsInput({ requiredFields: ['hostId', 'eventId'], dateFields: [] }, { hostId, eventId });
    const timeWindow = createFieldTimeWindow({ field: 'timestamp', hours });

    // Only include requested metrics in the facet
    const allMetrics = {
      attendanceFlow: buildAttendanceFlowPipeline(),
      zoneMetrics: buildZoneMetricsPipeline(),
      serviceMetrics: buildServiceMetricsPipeline(),
      securityMetrics: buildSecurityMetricsPipeline()
    };
    const facetMetrics = metrics
      ? Object.fromEntries(Object.entries(allMetrics).filter(([k]) => metrics.includes(k)))
      : allMetrics;

    const pipeline = [
      buildMatchStage({
        hostId: new ObjectId(hostId),
        eventId: new ObjectId(eventId),
        ...timeWindow
      }),
      buildFacetStage(facetMetrics),
      { $project: { _id: 0 } }
    ];
    const [result] = await EventModel.aggregate(pipeline);
    return result;
  });

export default getHostRealTimeMetrics; 