import getSongEngagementMetrics from './get-song-engagement-metrics.js';
import getPlaylistRecommendations from './get-playlist-recommendations.js';
import getDynamicPricingRecommendations from './get-dynamic-pricing-recommendations.js';
import getSongSequenceOptimization from './get-song-sequence-optimization.js';
import { createTimeWindow, matchEventSongs } from '../../../utils/analytics/shared-utils.js';

export default (context) => {
  const db = context.services.db;
  const ObjectId = context.services.ObjectId;
  const matchEventSongsWithId = matchEventSongs(ObjectId);
  return {
    getSongEngagementMetrics: getSongEngagementMetrics({ db, ObjectId, createTimeWindow, matchEventSongs: matchEventSongsWithId }),
    getPlaylistRecommendations: getPlaylistRecommendations({ db, ObjectId, createTimeWindow, matchEventSongs: matchEventSongsWithId }),
    getDynamicPricingRecommendations: getDynamicPricingRecommendations({ db, ObjectId, createTimeWindow, matchEventSongs: matchEventSongsWithId }),
    getSongSequenceOptimization: getSongSequenceOptimization({ db, ObjectId, createTimeWindow, matchEventSongs: matchEventSongsWithId })
  };
}; 