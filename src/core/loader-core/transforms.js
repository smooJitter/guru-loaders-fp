/**
 * Named transforms for loader pipelines (sync and async).
 *
 * - Co-locate sync and async transforms for clarity and maintainability.
 * - Use clear naming (e.g., asyncEnrichFromAPI) for async transforms.
 * - Both types can be used in composeTransforms and transformRegistry.
 *
 * | Transform Type      | Example Purpose                              |
 * |---------------------|----------------------------------------------|
 * | normalizeEvent      | Consistent array/object/factory output       |
 * | injectContext       | Add context/services to each module          |
 * | addMetadata         | Add type, timestamp, etc.                    |
 * | legacyAdapter       | Adapt old modules to new format              |
 * | wrapWithGuard       | Add logging/authorization to handlers        |
 * | validationFilter    | Remove invalid modules early                 |
 * | asyncEnrichFromAPI  | (Async) Enrich events with remote data       |
 */

import { isNil } from 'ramda';

// --- Sync Transforms ---
export const normalizeEvent = (mod, ctx) => {
  const modVal = !isNil(mod) && mod.default !== undefined ? mod.default : mod;
  const events = typeof modVal === 'function' ? modVal(ctx) : modVal;
  return Array.isArray(events) ? events : [events];
};

export const injectContext = (events, ctx) =>
  Array.isArray(events)
    ? events.map(event =>
        !isNil(event) && typeof event === 'object'
          ? { ...event, services: ctx?.services }
          : event
      )
    : events;

export const addMetadata = (events) =>
  Array.isArray(events)
    ? events.map(event =>
        !isNil(event) && typeof event === 'object'
          ? { ...event, type: 'event', timestamp: Date.now() }
          : event
      )
    : events;

export const legacyAdapter = (events) =>
  Array.isArray(events)
    ? events.map(event =>
        event && event.methods
          ? { ...event, event: event.methods.main || event.event }
          : event
      )
    : events;

export const wrapWithGuard = (events) =>
  Array.isArray(events)
    ? events.map(event =>
        !isNil(event) && typeof event === 'object' && typeof event.event === 'function'
          ? { ...event, event: (...args) => {
              console.log(`[GUARD] Executing event: ${event.name}`);
              return event.event(...args);
            }}
          : event
      )
    : events;

export const validationFilter = (events) =>
  Array.isArray(events)
    ? events.filter(event =>
        event && typeof event.name === 'string' && typeof event.event === 'function'
      )
    : [];

// --- Async Transforms ---
export const asyncEnrichFromAPI = async (events, ctx) => {
  if (!Array.isArray(events)) return events;
  // Example: fetch extra data for each event (mocked here)
  return Promise.all(events.map(async event => {
    if (!isNil(event) && typeof event === 'object') {
      const extra = await Promise.resolve({ info: `Extra for ${event.name}` });
      return { ...event, extra };
    }
    return event;
  }));
};

/**
 * Registry of named transforms (sync and async).
 */
export const transformRegistry = {
  normalizeEvent,
  injectContext,
  addMetadata,
  legacyAdapter,
  wrapWithGuard,
  validationFilter,
  asyncEnrichFromAPI,
  // Add more named transforms as needed...
};

/**
 * Compose transforms by name (from the registry) and/or by function.
 * Accepts an array of names (string) and/or transform functions.
 * Works with both sync and async transforms if used with the async loader.
 */
export const composeTransforms = (transforms = []) => async (mod, ctx) => {
  let acc = mod;
  for (const t of transforms) {
    if (typeof t === 'string' && transformRegistry[t]) {
      acc = await transformRegistry[t](acc, ctx);
    } else if (typeof t === 'function') {
      acc = await t(acc, ctx);
    }
  }
  return acc;
}; 


