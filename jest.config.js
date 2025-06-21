export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.mjs'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  testRunner: 'jest-circus/runner',
  moduleDirectories: ['node_modules', '<rootDir>'],
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
}; 