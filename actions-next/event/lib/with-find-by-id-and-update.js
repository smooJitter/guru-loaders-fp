// Helper for DRY findByIdAndUpdate with error handling and sanitization
export const withFindByIdAndUpdate = async ({
  Model,
  id,
  update,
  options = {},
  notFoundMsg = 'Not found',
  sanitize = (x) => x
}) => {
  const result = await Model.findByIdAndUpdate(id, update, options).lean().exec();
  if (!result) throw new Error(notFoundMsg);
  return sanitize(result);
}; 