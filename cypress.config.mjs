/* eslint-disable unicorn/numeric-separators-style */
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "https://localhost:30000",
  },
  requestTimeout: 10000,
  defaultCommandTimeout: 10000,
  viewportHeight: 768,
  viewportWidth: 1024,
});
