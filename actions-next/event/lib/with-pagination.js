// Utility for paginated queries
export const withPagination = async ({ queryFn, countFn, offset = 0, sanitize = (x) => x }) => {
  const [itemsRaw, total] = await Promise.all([
    queryFn(),
    countFn()
  ]);
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(sanitize) : [];
  return {
    items,
    total,
    hasMore: total > offset + items.length
  };
}; 