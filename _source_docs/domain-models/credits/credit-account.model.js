import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';

const { Schema, model } = mongoose;

const creditAccountSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance:   { type: Number, default: 0 },
});

creditAccountSchema.index({ userId: 1 });
creditAccountSchema.plugin(cleanToJSON);
creditAccountSchema.plugin(timestampsPlugin);

export default model('CreditAccount', creditAccountSchema); 