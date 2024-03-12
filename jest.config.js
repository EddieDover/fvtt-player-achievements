// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  testEnvironment: "jsdom",
  collectCoverageFrom: ["src/**/*.js"],
  coverageReporters: ["text", "text-summary", "lcov"],
};
