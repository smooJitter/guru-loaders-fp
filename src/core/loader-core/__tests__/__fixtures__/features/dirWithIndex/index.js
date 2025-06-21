export default {
  typeComposers: { Indexed: { fields: { id: 'ID' } } },
  queries: { indexedQuery: { resolve: () => 'indexed' } }
}; 