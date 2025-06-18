const mongoose = require('mongoose');

/**
 * @module mongoose-engageable.plugin
 * @description Adds engagement tracking (views, likes, bookmarks, etc.) and per-user engagement to a schema.
 * @param {Schema} schema - The Mongoose schema to enhance.
 * @param {Object} [options]
 * @example
 * schema.plugin(mongooseEngageablePlugin, { field: 'engagement', enableUserTracking: true });
 */

module.exports = function engageablePlugin(schema, options = {}) {
  const {
    field = 'engagement',
    userMapField = 'engagedUsers',
    enableUserTracking = true,
    scoreWeights = {
      views: 0.5,
      likes: 3,
      dislikes: -3,
      bookmarks: 2,
      shares: 4,
      commentsCount: 5
    }
  } = options;

  const ObjectId = mongoose.Schema.Types.ObjectId;

  // Main engagement field
  schema.add({
    [field]: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      dislikes: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    }
  });

  // Optional per-user tracker
  if (enableUserTracking) {
    schema.add({
      [userMapField]: [{
        user: { type: ObjectId, ref: 'User' },
        liked: Boolean,
        disliked: Boolean,
        bookmarked: Boolean,
        lastViewed: Date
      }]
    });
  }

  // === Utility Functions ===

  const getOrInitUserEngagement = function (doc, userId) {
    const map = doc[userMapField] || [];
    let record = map.find(e => e.user.toString() === userId.toString());
    if (!record) {
      record = { user: userId, liked: false, disliked: false, bookmarked: false };
      map.push(record);
    }
    return record;
  };

  const recalculateScore = function (doc) {
    const e = doc[field];
    const w = scoreWeights;
    doc[field].score =
      (e.views * w.views) +
      (e.likes * w.likes) +
      (e.dislikes * w.dislikes) +
      (e.bookmarks * w.bookmarks) +
      (e.shares * w.shares) +
      (e.commentsCount * w.commentsCount);
  };

  // === Methods ===

  schema.methods.incrementView = function (userId = null) {
    this[field].views += 1;

    if (enableUserTracking && userId) {
      const r = getOrInitUserEngagement(this, userId);
      r.lastViewed = new Date();
    }

    recalculateScore(this);
    return this;
  };

  schema.methods.toggleLike = function (userId) {
    if (!enableUserTracking) throw new Error('User tracking disabled');

    const r = getOrInitUserEngagement(this, userId);

    if (r.liked) {
      r.liked = false;
      this[field].likes -= 1;
    } else {
      r.liked = true;
      this[field].likes += 1;

      // Remove dislike if toggled
      if (r.disliked) {
        r.disliked = false;
        this[field].dislikes -= 1;
      }
    }

    recalculateScore(this);
    return this;
  };

  schema.methods.toggleDislike = function (userId) {
    if (!enableUserTracking) throw new Error('User tracking disabled');

    const r = getOrInitUserEngagement(this, userId);

    if (r.disliked) {
      r.disliked = false;
      this[field].dislikes -= 1;
    } else {
      r.disliked = true;
      this[field].dislikes += 1;

      if (r.liked) {
        r.liked = false;
        this[field].likes -= 1;
      }
    }

    recalculateScore(this);
    return this;
  };

  schema.methods.toggleBookmark = function (userId) {
    if (!enableUserTracking) throw new Error('User tracking disabled');

    const r = getOrInitUserEngagement(this, userId);

    if (r.bookmarked) {
      r.bookmarked = false;
      this[field].bookmarks -= 1;
    } else {
      r.bookmarked = true;
      this[field].bookmarks += 1;
    }

    recalculateScore(this);
    return this;
  };

  schema.methods.registerShare = function () {
    this[field].shares += 1;
    recalculateScore(this);
    return this;
  };

  schema.methods.incrementComments = function (by = 1) {
    this[field].commentsCount += by;
    recalculateScore(this);
    return this;
  };

  schema.methods.getEngagementScore = function () {
    return this[field].score;
  };

  // Optional virtuals
  schema.virtual('likeRatio').get(function () {
    const e = this[field];
    return (e.likes + e.dislikes) > 0 ? (e.likes / (e.likes + e.dislikes)) : 0;
  });

  schema.virtual('hotness').get(function () {
    const e = this[field];
    return e.score + (e.commentsCount * 2);
  });
};
