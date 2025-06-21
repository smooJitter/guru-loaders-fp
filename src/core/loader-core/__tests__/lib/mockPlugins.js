/**
 * Mock before plugin for loader-core tests.
 */
export const beforePlugin = {
  before: ctx => ({ ...ctx, before: true }),
};

/**
 * Mock after plugin for loader-core tests.
 */
export const afterPlugin = {
  after: ctx => ({ ...ctx, after: true }),
};
