import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import { VISIBILITY_ENUM } from './config/visibility.constants.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const merchantProfileSchema = new Schema({
    djAlias: { type: String },
    djGenres: [{ type: String }],
    styleTags: [{ type: String }],
    performanceNotes: { type: String },
    preferredRoomConfig: [{ type: String }]
  }, { _id: false });

  const guestProfileSchema = new Schema({
    favoriteGenres: [{ type: String }],
    isVip: { type: Boolean, default: false },
    hasUsedVipPass: { type: Boolean, default: false },
    tipHabitScore: { type: Number, min: 0, max: 1 }
  }, { _id: false });

  const userProfileSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    bio: { type: String },
    location: { type: String },
    social: {
      linkedIn: { type: String },
      twitter: { type: String },
      website: { type: String }
    },
    visibility: {
      type: String,
      enum: VISIBILITY_ENUM,
      default: 'public'
    },
    createdAt: { type: Date, default: Date.now },
    merchantProfile: merchantProfileSchema,
    guestProfile: guestProfileSchema
  });

  userProfileSchema.plugin(cleanToJSON);
  userProfileSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => userProfileSchema.plugin(plugin));

  if (mongooseConnection.models.UserProfile) {
    return mongooseConnection.models.UserProfile;
  }
  return mongooseConnection.model('UserProfile', userProfileSchema);
}; 