import { createAsyncLoader } from '../core/loader-core/loader-async.js';
import { buildEventPipelineRegistries } from '../core/loader-core/lib/registry-builders.js';
import * as R from 'ramda';

const EVENT_PATTERNS = [
  '**/*.event.js',
  '**/events/**/*.index.js'
];

// Import and apply: handles factory/object, flattens arrays, augments with type/timestamp
export const importAndApplyAllEvents = async (files, context) => {
  const modules = await Promise.all(
    (files || []).map(async (file) => {
      let mod = (await import(file)).default ?? (await import(file));
      let eventObj = typeof mod === 'function' ? await mod(context) : mod;
      if (Array.isArray(eventObj)) {
        return eventObj.map(ev => ev && typeof ev === 'object' ? { ...ev, type: 'event', timestamp: Date.now() } : null);
      } else if (eventObj && typeof eventObj === 'object') {
        return { ...eventObj, type: 'event', timestamp: Date.now() };
      }
      return null;
    })
  );
  // Flatten and filter out nulls
  return R.flatten(modules).filter(Boolean);
};

// Context-agnostic validation: only allow { name: string, event: function }
export const validateEventModule = (mod) => {
  return !!mod && typeof mod.name === 'string' && typeof mod.event === 'function';
};

// Factory for composable event loader
export const createEventLoader = (options = {}) =>
  createAsyncLoader('events', {
    patterns: options.patterns || EVENT_PATTERNS,
    findFiles: options.findFiles,
    importAndApplyAll: options.importAndApplyAll || importAndApplyAllEvents,
    validate: options.validate || validateEventModule,
    registryBuilder: options.registryBuilder || buildEventPipelineRegistries,
    contextKey: 'events',
    ...options
  });

export const eventLoader = createEventLoader();
export default eventLoader; 