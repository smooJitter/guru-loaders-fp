import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';

const { Schema, model } = mongoose;

const planSchema = new Schema({
  name:          { type: String, required: true, unique: true },
  stripePriceId: { type: String, required: true, unique: true, select: false },
  isActive:      { type: Boolean, default: true }
});

planSchema.index({ name: 1 }, { unique: true });
planSchema.plugin(cleanToJSON);

export default model('Plan', planSchema); 