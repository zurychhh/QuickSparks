module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'text-summary'],
  verbose: true,
  testTimeout: 30000, // Increase timeout for conversion tests
};