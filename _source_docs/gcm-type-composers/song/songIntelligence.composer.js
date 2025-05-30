import { Schema } from 'mongoose';
import { schemaComposer } from 'graphql-compose';
import { composeMongoose, convertSchemaToGraphQL } from 'graphql-compose-mongoose';
import { isAuthenticated, hasRole } from '../../lib/guards';

// First convert embedded types that will be reused
convertSchemaToGraphQL(
  new Schema({
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    matchRate: { type: Number, required: true },
    engagementScore: { type: Number, required: true }
  }, { _id: false }),
  'SwipeMetrics',
  schemaComposer
);

convertSchemaToGraphQL(
  new Schema({
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    tipperCount: { type: Number, required: true },
    avgTipPerUser: { type: Number, required: true },
    tipFrequency: { type: Number, required: true }
  }, { _id: false }),
  'CreditMetrics',
  schemaComposer
);

// Main schemas with their models
const SongEngagementMetrics = mongoose.model('SongEngagementMetrics', new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  swipeMetrics: [{
    _id: false,
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    matchRate: { type: Number, required: true },
    engagementScore: { type: Number, required: true }
  }],
  creditMetrics: [{
    _id: false,
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    tipperCount: { type: Number, required: true },
    avgTipPerUser: { type: Number, required: true },
    tipFrequency: { type: Number, required: true }
  }],
  timePatterns: [{
    _id: false,
    hour: { type: Number, required: true },
    engagement: { type: Number, required: true }
  }],
  genreMetrics: [{
    _id: false,
    genre: { type: String, required: true },
    engagementPerSong: { type: Number, required: true },
    popularity: { type: Number, required: true }
  }]
}));

const PlaylistRecommendations = mongoose.model('PlaylistRecommendations', new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  vibeMetrics: {
    avgTempo: { type: Number, required: true },
    avgEnergy: { type: Number, required: true },
    dominantGenres: [{ type: String, required: true }],
    successfulMoods: [{ type: String }]
  },
  requestPatterns: [{
    _id: false,
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    requestCount: { type: Number, required: true },
    totalCredits: { type: Number, required: true },
    uniqueRequesters: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }]
  }],
  crowdEnergy: [{
    _id: false,
    timeBlock: { type: Number, required: true },
    energyScore: { type: Number, required: true }
  }]
}));

const DynamicPricingRecommendations = mongoose.model('DynamicPricingRecommendations', new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  priceSensitivity: [{
    _id: false,
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    pricePoint: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'premium'],
      required: true 
    },
    requestCount: { type: Number, required: true },
    conversionRate: { type: Number, required: true }
  }],
  timeBasedPricing: [{
    _id: false,
    timeBlock: { type: Number, required: true },
    priceElasticity: { type: Number, required: true },
    demandScore: { type: Number, required: true }
  }],
  genrePricing: [{
    _id: false,
    genre: { type: String, required: true },
    priceRange: {
      suggested: { type: Number, required: true },
      ceiling: { type: Number, required: true }
    },
    demandMetrics: {
      totalRequests: { type: Number, required: true },
      uniqueRequesters: { type: Number, required: true }
    }
  }]
}));

const SongSequenceOptimization = mongoose.model('SongSequenceOptimization', new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  transitionPatterns: [{
    _id: false,
    transition: {
      fromGenre: { type: String, required: true },
      toGenre: { type: String, required: true }
    },
    successRate: { type: Number, required: true }
  }],
  energyFlow: [{
    _id: false,
    timeBlock: { type: Number, required: true },
    energyLevel: { 
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true 
    },
    engagement: { type: Number, required: true }
  }],
  moodProgression: [{
    _id: false,
    timeBlock: { type: Number, required: true },
    mood: { type: String, required: true },
    effectiveness: { type: Number, required: true }
  }]
}));

// Create TypeComposers with customization options
const SongEngagementMetricsTC = composeMongoose(SongEngagementMetrics, {
  name: 'SongEngagementMetrics',
  fields: {
    remove: ['__v'],
  },
});

const PlaylistRecommendationsTC = composeMongoose(PlaylistRecommendations, {
  name: 'PlaylistRecommendations',
  fields: {
    remove: ['__v'],
  },
});

const DynamicPricingRecommendationsTC = composeMongoose(DynamicPricingRecommendations, {
  name: 'DynamicPricingRecommendations',
  fields: {
    remove: ['__v'],
  },
});

const SongSequenceOptimizationTC = composeMongoose(SongSequenceOptimization, {
  name: 'SongSequenceOptimization',
  fields: {
    remove: ['__v'],
  },
});

// Add relations
SongEngagementMetricsTC.addRelation('event', {
  resolver: () => EventTC.getResolver('findById'),
  prepareArgs: {
    _id: (source) => source.eventId,
  },
  projection: { eventId: true },
});

PlaylistRecommendationsTC.addRelation('event', {
  resolver: () => EventTC.getResolver('findById'),
  prepareArgs: {
    _id: (source) => source.eventId,
  },
  projection: { eventId: true },
});

// Add access control wrappers
function restrictToRoles(roles) {
  return (resolver) => {
    return resolver.wrapResolve((next) => async (rp) => {
      const { role } = rp.context;
      if (!roles.includes(role)) {
        throw new Error('Access denied');
      }

      // Add beforeQuery hook for field-level access control
      rp.beforeQuery = (query) => {
        if (role !== 'ADMIN') {
          // Restrict sensitive fields for non-admins
          query.select('-priceSensitivity.conversionRate -timeBasedPricing.priceElasticity');
        }
      };

      return next(rp);
    });
  };
}

// Add resolvers to schema
schemaComposer.Query.addFields({
  songEngagementMetrics: SongEngagementMetricsTC.mongooseResolvers
    .findOne()
    .wrapResolve(restrictToRoles(['DJ', 'ADMIN'])),

  playlistRecommendations: PlaylistRecommendationsTC.mongooseResolvers
    .findOne()
    .wrapResolve(restrictToRoles(['DJ', 'ADMIN']))
    .addArgs({
      eventId: 'MongoID!',
    }),

  dynamicPricingRecommendations: DynamicPricingRecommendationsTC.mongooseResolvers
    .findOne()
    .wrapResolve(restrictToRoles(['DJ', 'ADMIN']))
    .addArgs({
      eventId: 'MongoID!',
    }),

  songSequenceOptimization: SongSequenceOptimizationTC.mongooseResolvers
    .findOne()
    .wrapResolve(restrictToRoles(['DJ', 'ADMIN']))
    .addArgs({
      eventId: 'MongoID!',
    }),
});

// Add mutations for array operations
schemaComposer.Mutation.addFields({
  songEngagementMetricsAddSwipe: {
    type: SongEngagementMetricsTC,
    args: {
      eventId: 'MongoID!',
      swipeData: 'SwipeMetricsInput!',
    },
    resolve: async (source, args, context, info) => {
      const result = await SongEngagementMetrics.findOneAndUpdate(
        { eventId: args.eventId },
        { $push: { swipeMetrics: args.swipeData } },
        { new: true }
      );
      return result;
    },
  },

  playlistRecommendationsAddRequest: {
    type: PlaylistRecommendationsTC,
    args: {
      eventId: 'MongoID!',
      requestData: 'RequestPatternInput!',
    },
    resolve: async (source, args, context, info) => {
      const result = await PlaylistRecommendations.findOneAndUpdate(
        { eventId: args.eventId },
        { $push: { requestPatterns: args.requestData } },
        { new: true }
      );
      return result;
    },
  },
}); 