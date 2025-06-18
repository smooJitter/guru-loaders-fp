/**
 * @module mongoose-timestamps.plugin
 * @description Mongoose plugin to add createdAt and updatedAt timestamp fields to a schema.
 * @param {Schema} schema - The Mongoose schema to enhance.
 * @example
 * schema.plugin(mongooseTimestampsPlugin);
 */
export function timestampsPlugin(schema) {
  schema.add({
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });

  schema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });

  schema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
  });
}

export default timestampsPlugin;
