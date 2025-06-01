import {
  buildMatchStage,
  buildFacetStage,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';
import {
  buildSocialMetricsPipeline,
  buildInteractionMetricsPipeline,
  buildFeedbackMetricsPipeline,
  buildEngagementPatternsPipeline
} from './lib/metrics-pipelines.js';

/**
 * Get audience engagement metrics (configurable, optimized).
 * @param {Object} deps - Dependencies: EventModel, ObjectId, withErrorHandling
 * @returns {Function} (hostId, eventId, options) => Promise<AnalyticsResult>
 * @param {Array<string>} [options.metrics] - Sub-metrics to compute (default: all)
 */
const getHostAudienceEngagementMetrics = ({ EventModel, ObjectId, withErrorHandling }) =>
  withErrorHandling(async (hostId, eventId, { metrics = null } = {}) => {
    validateAnalyticsInput({ requiredFields: ['hostId', 'eventId'] }, { hostId, eventId });
    const allMetrics = {
      socialMetrics: buildSocialMetricsPipeline(),
      interactionMetrics: buildInteractionMetricsPipeline(),
      feedbackMetrics: buildFeedbackMetricsPipeline(),
      engagementPatterns: buildEngagementPatternsPipeline()
    };
    const facetMetrics = metrics
      ? Object.fromEntries(Object.entries(allMetrics).filter(([k]) => metrics.includes(k)))
      : allMetrics;
    const pipeline = [
      buildMatchStage({
        hostId: new ObjectId(hostId),
        eventId: new ObjectId(eventId)
      }),
      buildFacetStage(facetMetrics),
      { $project: { _id: 0 } }
    ];
    const [result] = await EventModel.aggregate(pipeline);
    return result;
  });

export default getHostAudienceEngagementMetrics; 