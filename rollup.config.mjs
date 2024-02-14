// SPDX-FileCopyrightText: 2022 Johannes Loher
// SPDX-FileCopyrightText: 2022 David Archibald
//
// SPDX-License-Identifier: MIT
import copy from "rollup-plugin-copy";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default () => ({
  input: "src/module/fvtt-player-achievements.js",
  output: {
    dir: "dist/module",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    copy({
      targets: [
        { src: "*.md", dest: "dist" },
        { src: "src/images/*", dest: "dist/images" },
        { src: "src/sounds/*", dest: "dist/sounds" },
      ],
    }),
  ],
});
