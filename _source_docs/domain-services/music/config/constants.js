// Song status constants
export const SONG_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

// Rating types
export const RATING_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  DJ: 'dj'
};

// Swipe directions
export const SWIPE_DIRECTIONS = {
  LEFT: 'left',
  RIGHT: 'right'
};

// Time ranges for analytics
export const TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all'
};

// Analytics grouping
export const GROUP_BY = {
  DAY: 'day',
  MONTH: 'month'
};

// Request status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PLAYED: 'played'
};

// Request source
export const REQUEST_SOURCE = {
  SWIPE: 'swipe',
  MANUAL: 'manual',
  SYSTEM: 'system'
};

// Error messages
export const ERRORS = {
  SONG_NOT_FOUND: (id) => `Song not found with id: ${id}`,
  INVALID_RATING: 'Rating must be between 1 and 5',
  INVALID_STATUS: 'Invalid song status',
  REQUIRED_FIELDS: 'Title and artist are required',
  DUPLICATE_SONG: 'A song with this title and artist already exists',
  INVALID_TIME_RANGE: 'Invalid time range specified',
  INVALID_GROUP_BY: 'Invalid grouping specified',
  INVALID_SWIPE_DIRECTION: 'Swipe direction must be left or right',
  SWIPE_NOT_FOUND: (id) => `Swipe not found with id: ${id}`,
  REQUEST_NOT_FOUND: (id) => `Song request not found with id: ${id}`,
  INVALID_REQUEST_STATUS: 'Invalid request status for this operation',
  DUPLICATE_REQUEST: 'You already have a pending request for this song',
  INSUFFICIENT_CREDITS: 'Insufficient credits to make this request',
  CREDIT_DEDUCTION_FAILED: 'Failed to deduct credits for request',
  CREDIT_REFUND_FAILED: 'Failed to refund credits for rejected request'
};

// Event names
export const EVENTS = {
  SONG_CREATED: 'song.created',
  SONG_UPDATED: 'song.updated',
  SONG_STATUS_UPDATED: 'song.status.updated',
  SONG_PLAYED: 'song.played',
  SONG_RATED: 'song.rated',
  SONG_ANALYTICS_GENERATED: 'song.analytics.generated',
  SONG_TRENDING_UPDATED: 'song.trending.updated',
  SONG_SWIPED: 'song.swiped',
  SWIPE_ANALYTICS_GENERATED: 'swipe.analytics.generated',
  SONG_REQUESTED: 'song.requested',
  SONG_REQUEST_APPROVED: 'song.request.approved',
  SONG_REQUEST_REJECTED: 'song.request.rejected',
  SONG_REQUEST_PLAYED: 'song.request.played',
  CREDITS_DEDUCTED: 'credits.deducted',
  CREDITS_REFUNDED: 'credits.refunded'
};

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_RATING: 5,
  MIN_RATING: 1,
  TRENDING_WINDOW: 7,
  TOP_SONGS_LIMIT: 10,
  RECOMMENDATION_LIMIT: 10,
  TOP_GENRES_LIMIT: 3,
  REQUEST_CREDITS_COST: 1,
  MAX_PENDING_REQUESTS: 5,
  REQUEST_PRIORITY_BOOST: 1
}; 