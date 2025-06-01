import getHostPerformanceMetrics from './get-host-performance-metrics.js';
import getHostPredictiveInsights from './get-host-predictive-insights.js';
import getHostRealTimeMetrics from './get-host-real-time-metrics.js';
import getHostAudienceEngagementMetrics from './get-host-audience-engagement-metrics.js';

export default (context) => ({
  getHostPerformanceMetrics: getHostPerformanceMetrics({
    EventModel: context.models.Event,
    ObjectId: context.services.ObjectId,
    withErrorHandling: context.services.withErrorHandling,
  }),
  getHostPredictiveInsights: getHostPredictiveInsights({
    EventModel: context.models.Event,
    ObjectId: context.services.ObjectId,
    withErrorHandling: context.services.withErrorHandling,
  }),
  getHostRealTimeMetrics: getHostRealTimeMetrics({
    EventModel: context.models.Event,
    ObjectId: context.services.ObjectId,
    withErrorHandling: context.services.withErrorHandling,
  }),
  getHostAudienceEngagementMetrics: getHostAudienceEngagementMetrics({
    EventModel: context.models.Event,
    ObjectId: context.services.ObjectId,
    withErrorHandling: context.services.withErrorHandling,
  }),
}); 