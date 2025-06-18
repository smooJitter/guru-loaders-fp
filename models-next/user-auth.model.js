import bcrypt from 'bcrypt';
import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import { AUTH_PROVIDER_ENUM, AUTH_METHOD_ENUM } from './config/auth.constants.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const userAuthSchema = new Schema({
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    passwordHash: { type: String, select: false },
    provider: {
      type: String,
      enum: AUTH_PROVIDER_ENUM,
      default: 'local'
    },
    providerId:   { type: String },
    providerData: {
      accessToken:  { type: String },
      refreshToken: { type: String },
      profile:      { type: Schema.Types.Mixed }
    },
    token:      { type: String, select: false },
    method: {
      type: String,
      enum: AUTH_METHOD_ENUM,
      default: 'local'
    },
    deviceInfo: { type: String },
    resetToken: { type: String, select: false },
    expiresAt:  { type: Date },
    createdAt:  { type: Date, default: Date.now },
    passwordSalt: { type: String, required: true, select: false },
    lastPasswordChange: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
  });

  // Indexes
  userAuthSchema.index({ userId: 1, provider: 1 }, { unique: true });
  userAuthSchema.index({ resetToken: 1, expiresAt: 1 });

  // Password hashing hook
  userAuthSchema.pre('save', async function () {
    if (this.isModified('passwordHash')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  });

  // Reset-token setter
  userAuthSchema.methods.setResetToken = function (token, ttlMinutes = 30) {
    this.resetToken = token;
    this.expiresAt  = new Date(Date.now() + ttlMinutes * 60 * 1000);
  };

  // toJSON: remove sensitive fields
  userAuthSchema.plugin(cleanToJSON);
  userAuthSchema.plugin(cleanToJSON);

  userAuthSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id; delete ret._id;
      delete ret.passwordHash;
      delete ret.token;
      delete ret.resetToken;
      if (ret.providerData) {
        delete ret.providerData.accessToken;
        delete ret.providerData.refreshToken;
      }
      return ret;
    }
  });

  additionalPlugins.forEach(plugin => userAuthSchema.plugin(plugin));

  if (mongooseConnection.models.UserAuth) {
    return mongooseConnection.models.UserAuth;
  }
  return mongooseConnection.model('UserAuth', userAuthSchema);
}; 