// Mongoose plugin: cleanToJSON
// Adds a toJSON transform that removes __v and (optionally) other unwanted fields

export default function cleanToJSON(schema, options = {}) {
  const removeFields = ['__v', ...(options.removeFields || [])];

  if (!schema.options.toJSON) schema.options.toJSON = {};
  const originalTransform = schema.options.toJSON.transform;

  schema.options.toJSON.transform = function (doc, ret, opts) {
    // Remove unwanted fields
    for (const field of removeFields) {
      delete ret[field];
    }
    // Call any existing transform
    if (typeof originalTransform === 'function') {
      return originalTransform(doc, ret, opts);
    }
    return ret;
  };
} 