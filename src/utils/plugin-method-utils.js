import * as R from 'ramda';

/**
 * Extracts plugin methods from a Mongoose model using Ramda.
 * @param {mongoose.Model} model - The Mongoose model to inspect.
 * @returns {Object} An immutable object containing plugin methods.
 */
export const getPluginMethods = (model) => {
  const schema = model.schema;
  if (!schema || !schema.methods) return {};
  const pluginMethods = R.pipe(
    R.toPairs,
    R.map(([key, value]) => [key, value.bind({})]),
    R.fromPairs
  )(schema.methods);
  return Object.freeze(pluginMethods);
}; 