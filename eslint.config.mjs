import jestPlugin from "eslint-plugin-jest";
import jsdocPlugin from "eslint-plugin-jsdoc";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import { createRequire } from "node:module";

// Foundry VTT globals (game, Hooks, ChatMessage, canvas, ui, ...) from the legacy shareable config.
const require = createRequire(import.meta.url);
const foundryGlobals = require("@typhonjs-fvtt/eslint-config-foundry.js/0.8.0.js").globals;

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "reference/**",
      "ghpages/**",
      "api_doc_generation/**",
      "coverage/**",
      "assets/**",
    ],
  },
  unicornPlugin.configs.recommended,
  jsdocPlugin.configs["flat/recommended"],
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...foundryGlobals,
      },
    },
    rules: {
      "linebreak-style": ["error", "unix"],
      "require-await": "error",
      "no-return-await": "error",
      "no-undef": "error",
      "no-unused-vars": ["error", { args: "all", argsIgnorePattern: "^_" }],
      "jsdoc/require-jsdoc": "error",
      // Would force renaming long-established files/identifiers (utils.js, etc.).
      "unicorn/prevent-abbreviations": "off",
    },
  },
  {
    files: ["**/*.cjs", "*.mjs", "jest.config.js", "src/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["test/**/*.js"],
    ...jestPlugin.configs["flat/recommended"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
