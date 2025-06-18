import mongoose from 'mongoose';
import { getPluginMethods } from './get-plugin-methods.js';
import { mongooseTaggablePlugin } from '../mongoose-taggable.plugin.js';

// Example: Define a simple schema and apply a plugin
const ExampleSchema = new mongoose.Schema({ name: String });
ExampleSchema.plugin(mongooseTaggablePlugin, { field: 'tags' });
const ExampleModel = mongoose.model('Example', ExampleSchema);

// Get plugin methods
const pluginMethods = getPluginMethods(ExampleModel);

console.log('Available plugin methods:', Object.keys(pluginMethods));

// Usage: create a document and use a plugin method
const doc = new ExampleModel({ name: 'Test' });
pluginMethods.addTag.call(doc, 'demo', 'custom');
console.log('Tags after addTag:', doc.tags); 