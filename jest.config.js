// eslint-disable-next-line unicorn/prefer-module
export default {
  testEnvironment: "jsdom",
  collectCoverageFrom: ["src/**/*.js"],
  coverageReporters: ["text", "text-summary", "lcov"],
};
