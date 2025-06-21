export default {
  typeComposers: { Valid: { fields: { id: 'ID' } } },
  queries: { validQuery: { resolve: () => 'ok' } }
}; 