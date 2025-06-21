// Developer tool: Audit plugin methods vs. mutation actions
// Usage: node actions-next/utils/plugin-action-audit.js
// (Assumes models and actions are importable in Node context)

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getPluginMethods } from '../../models-next/plugins/utils/get-plugin-methods.js';

// List of models and their corresponding action files
const MODELS = [
  {
    name: 'Song',
    modelPath: 'models-next/event-song.model.js',
    actionsPath: 'actions-next/event-music/song/event-song-mutation.actions.js',
  },
  {
    name: 'SongRequest',
    modelPath: 'models-next/event-song-request.model.js',
    actionsPath: 'actions-next/event-music/song-request/event-song-request-mutation.actions.js',
  },
  {
    name: 'SongSwipe',
    modelPath: 'models-next/event-song-swipe.model.js',
    actionsPath: 'actions-next/event-music/song-swipe/event-song-swipe-mutation.actions.js',
  },
];

// Helper to get exported action names from a file
function getExportedActionNames(filePath) {
  const absPath = path.join(process.cwd(), filePath);
  const fileContent = fs.readFileSync(absPath, 'utf-8');
  // Look for export default withNamespace('...', { ... })
  const match = fileContent.match(/withNamespace\([^,]+,\s*{([\s\S]*?)}\)/);
  if (!match) return [];
  const actionsBlock = match[1];
  // Extract keys (action names)
  return Array.from(actionsBlock.matchAll(/([a-zA-Z0-9_]+)\s*:/g)).map(m => m[1]);
}

async function audit() {
  for (const { name, modelPath, actionsPath } of MODELS) {
    let model;
    try {
      const absModelPath = path.join(process.cwd(), modelPath);
      model = (await import(absModelPath)).default;
    } catch (e) {
      console.error(`Could not import model for ${name}:`, e.message);
      continue;
    }
    const pluginMethods = Object.keys(getPluginMethods(model));
    const actionNames = getExportedActionNames(actionsPath);
    const missing = pluginMethods.filter(
      (method) => !actionNames.includes(method)
    );
    console.log(`\nModel: ${name}`);
    console.log(`  Plugin methods: ${pluginMethods.join(', ')}`);
    console.log(`  Mutation actions: ${actionNames.join(', ')}`);
    if (missing.length) {
      console.log(`  ❌ Missing mutation actions for plugin methods: ${missing.join(', ')}`);
    } else {
      console.log('  ✅ All plugin methods are exposed as mutation actions.');
    }
  }
}

audit(); 