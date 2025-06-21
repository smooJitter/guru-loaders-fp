/**
 * Returns a mock context object for loader-core tests.
 * Allows overrides for flexibility.
 * @param {object} overrides
 * @returns {object}
 */
export const mockContext = (overrides = {}) => ({
  services: {},
  user: { id: 'test-user', roles: ['ADMIN'] },
  tenant: { id: 'test-tenant' },
  ...overrides,
});
