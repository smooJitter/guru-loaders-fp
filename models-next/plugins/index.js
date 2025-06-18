/**
 * Mongoose Plugins
 */

// Core plugins
export { default as mongooseTimestampsPlugin } from './mongoose-timestamps.plugin.js';
export { default as mongooseSoftDeletePlugin } from './mongoose-soft-delete.plugin.js';

// Tracking plugins
export { default as mongooseStatusTrackableWithMetaPlugin } from './mongoose-status-trackable-with-meta.plugin.js';
export { default as mongooseTimetrackablePlugin } from './mongoose-timetrackable.plugin.js';
export { default as mongooseStatusTrackableFlexPlugin } from './mongoose-status-trackable-flex.plugin.js';

// Tagging plugins
export { default as mongooseTaggablePlugin } from './mongoose-taggable.plugin.js';
export { default as mongooseTaggableFlexPlugin } from './mongoose-taggable-flex.plugin.js';
export { default as mongooseTaggableFlexWeightedPlugin } from './mongoose-taggable-flex-weighted.plugin.js';
export { default as mongooseTaggableWeightedPlugin } from './mongoose-taggable-weighted.plugin.js';

// Scoring plugins
export { default as mongooseScoreablePlugin } from './mongoose-scoreable.plugin.js';
export { default as mongooseScoreableFlexPlugin } from './mongoose-scoreable-flex.plugin.js';

// Flagging plugins
export { default as mongooseFlaggablePlugin } from './mongoose-flaggable.plugin.js';

// RBAC plugin
export { default as mongooseRbacPlugin } from './mongoose-rbac.plugin.js';

// Additional plugins
export { default as mongooseEngageablePlugin } from './mongoose-engageable.plugin.js';
export { default as mongooseProfilePlugin } from './mongoose-profile.plugin.js';
export { default as mongooseDateInfoPlugin } from './mongoose-date-info.plugin.js'; 