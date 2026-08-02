/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/test/**/*.test.js"],
  setupFiles: ["<rootDir>/test/setup/jest-globals.cjs"],
  clearMocks: true,
  collectCoverageFrom: ["src/module/**/*.js"],
};

module.exports = config;
