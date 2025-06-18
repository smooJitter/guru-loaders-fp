export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^\.\./file-utils-new\.js$': '<rootDir>/src/utils/file-utils-new.js',
    '^\.\./async-pipeline-utils\.js$': '<rootDir>/src/utils/async-pipeline-utils.js',
    '^\.\./async-collection-utils\.js$': '<rootDir>/src/utils/async-collection-utils.js',
  },
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
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  testRunner: 'jest-circus/runner',
  moduleDirectories: ['node_modules', 'src', '<rootDir>'],
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>', '<rootDir>/src'],
  resolver: undefined
}; 