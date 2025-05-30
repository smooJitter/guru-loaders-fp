/**
 * Mongoose Plugins
 */

// Core plugins
export { timestampsPlugin } from './timestamps.js';
export { softDeletePlugin } from './softDelete.js';

// Tracking plugins
export { statusTrackableWithMetaPlugin } from './statusTrackableWithMeta.js';
export { timetrackablePlugin } from './timetrackable.js';

// Tagging plugins
export { taggablePlugin } from './taggable.js';
export { taggableFlexPlugin } from './taggable-flex.js';
export { taggableFlexWeightedPlugin } from './taggableFlexWeighted.js';

// Scoring plugins
export { scoreablePlugin } from './scoreable.js';
export { scoreableFlexPlugin } from './scoreable-flex.js';

// Flagging plugins
export { flaggablePlugin } from './flaggable.js';

// RBAC plugin
export { rbacPlugin, roleSchema } from './rbac.js'; 