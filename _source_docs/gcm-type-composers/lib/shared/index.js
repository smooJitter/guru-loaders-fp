/**
 * Index file for shared type composers
 * @module gcm-type-composers/lib/shared
 */

// Core type composers
export * from './core/metadata.typeComposer.js';

// Contact type composers
export * from './contact/address.typeComposer.js';

// Media type composers
export * from './media/image.typeComposer.js';

// Payment type composers
export * from './payment/ticket.typeComposer.js';

// Interaction type composers
export * from './interaction/comment.typeComposer.js';
export * from './interaction/notification.typeComposer.js';

// Scheduling type composers
export * from './scheduling/timeSlot.typeComposer.js';

// Location type composers
export * from './location/geo.typeComposer.js';

// Note: Additional type composers will be added for:
// - interaction/comment.typeComposer.js
// - interaction/notification.typeComposer.js
// - scheduling/timeSlot.typeComposer.js
// - location/geo.typeComposer.js

// Note: Add exports for other shared type composers as they are created
// export * from './core/metadata.typeComposer.js';
// export * from './contact/address.typeComposer.js';
// export * from './media/image.typeComposer.js';
// etc... 