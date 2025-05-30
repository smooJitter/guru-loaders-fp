import { isAuthenticated, hasRole } from '../../lib/guards';
import {
  getSongEngagementMetrics,
  getPlaylistRecommendations,
  getDynamicPricingRecommendations,
  getSongSequenceOptimization
} from '../../domain-services/analytics/songIntelligence';

export const songIntelligenceResolvers = {
  Query: {
    songEngagementMetrics: isAuthenticated(hasRole(['DJ', 'ADMIN'])(
      async (_, { eventId }, context) => {
        return getSongEngagementMetrics(eventId, context);
      }
    )),

    playlistRecommendations: isAuthenticated(hasRole(['DJ', 'ADMIN'])(
      async (_, { eventId }, context) => {
        return getPlaylistRecommendations(eventId, context);
      }
    )),

    dynamicPricingRecommendations: isAuthenticated(hasRole(['DJ', 'ADMIN'])(
      async (_, { eventId }, context) => {
        return getDynamicPricingRecommendations(eventId, context);
      }
    )),

    songSequenceOptimization: isAuthenticated(hasRole(['DJ', 'ADMIN'])(
      async (_, { eventId }, context) => {
        return getSongSequenceOptimization(eventId, context);
      }
    ))
  }
}; 