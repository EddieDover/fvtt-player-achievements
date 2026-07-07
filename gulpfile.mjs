// SPDX-FileCopyrightText: 2022 Johannes Loher
// SPDX-FileCopyrightText: 2022 David Archibald
//
// SPDX-License-Identifier: MIT

import fs from "fs-extra";
import gulp from "gulp";
import { deleteAsync } from "del";
import zip from "gulp-zip";
import rename from "gulp-rename";
import * as sass from "sass";
import sourcemaps from "gulp-sourcemaps";
import path from "node:path";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import rollupStream from "@rollup/stream";

import rollupConfig from "./rollup.config.mjs";

/** */
/*  CONFIGURATION   */
/** */

const packageId = "fvtt-player-achievements";
const sourceDirectory = "./src";
const distributionDirectory = "./dist";
const stylesDirectory = `${sourceDirectory}/styles`;
const stylesExtension = "scss";
const sourceFileExtension = "js";
const staticFiles = ["assets", "fonts", "lang", "packs", "templates", "module.json"];

/** */
/*      BUILD       */
/** */

let cache;

/**
 * Build the distributable JavaScript code
 * @returns {NodeJS.ReadWriteStream}
 */
function buildCode() {
  return rollupStream({ ...rollupConfig(), cache })
    .on("bundle", (bundle) => {
      cache = bundle;
    })
    .pipe(source(`${packageId}.js`))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${distributionDirectory}/module`));
}

/**
 * Build style sheets
 */
async function buildStyles() {
  const result = sass.compile(`${stylesDirectory}/${packageId}.${stylesExtension}`);
  await fs.outputFile(`${distributionDirectory}/styles/${packageId}.css`, result.css);
}

/**
 * Copy static files
 */
async function copyFiles() {
  for (const file of staticFiles) {
    if (fs.existsSync(`${sourceDirectory}/${file}`)) {
      await fs.copy(`${sourceDirectory}/${file}`, `${distributionDirectory}/${file}`, { encoding: false });
    }
  }
}

/**
 * Cleans the dist folder
 * @returns {Promise<void>} The cleaned files
 */
function cleanDistribution() {
  return deleteAsync([`${distributionDirectory}/**/*`, `${distributionDirectory}`]);
}

/**
 * Copies the files ot the dist folder in prep for packaging
 * @returns {NodeJS.ReadWriteStream} The copied files
 */
function copyDistribution() {
  // Take everything inside the dist folder and zip it into a subfolder named totm.zip
  return gulp
    .src(`${distributionDirectory}/**/*`, { encoding: false })
    .pipe(gulp.dest(`${distributionDirectory}/${packageId}`));
}

/**
 * Packages the dist subfolderfolder into a zip file
 * @returns {NodeJS.ReadWriteStream} The zipped files
 */
function zipDistribution() {
  return gulp
    .src(`${distributionDirectory}/${packageId}/**/*`, { base: `${distributionDirectory}`, encoding: false })
    .pipe(zip(`${packageId}.zip`))
    .pipe(gulp.dest(`${distributionDirectory}`));
}

/**
 * Watch for changes for each build step
 */
export function watch() {
  gulp.watch(`${sourceDirectory}/**/*.${sourceFileExtension}`, { ignoreInitial: false }, buildCode);
  gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
  gulp.watch(
    staticFiles.map((file) => `${sourceDirectory}/${file}`),
    { ignoreInitial: false },
    copyFiles,
  );
}

export const build = gulp.series(cleanDistribution, gulp.parallel(buildCode, buildStyles, copyFiles));

/********************/
/*    DEV EXPORT    */
/********************/

export const devexport = gulp.series(cleanDistribution, build, copyDistribution, zipDistribution);

/** */
/*      CLEAN       */
/** */

/**
 * Remove built files from `dist` folder while ignoring source files
 */
export async function clean() {
  const files = [...staticFiles, "module"];

  if (fs.existsSync(`${stylesDirectory}/${packageId}.${stylesExtension}`)) {
    files.push("styles");
  }

  console.log(" ", "Files to clean:");
  console.log("   ", files.join("\n    "));

  for (const filePath of files) {
    await fs.remove(`${distributionDirectory}/${filePath}`);
  }
}

/** */
/*      PACKAGE      */
/** */

// Define a task to zip the contents of the /dist folder into a subfolder
gulp.task("zip-dist", () => {
  return gulp
    .src("dist/**/*")
    .pipe(
      rename((ipath) => {
        // Rename to put the contents inside 'subsubsub' folder
        path.dirname = `${packageId}/${ipath.dirname}`;
      }),
    )
    .pipe(zip(`${packageId}.zip`))
    .pipe(gulp.dest("."));
});
/** */
/*       LINK       */
/** */

/**
 * Get the data paths of Foundry VTT based on what is configured in `foundryconfig.json`
 * @returns {string[]}
 */
function getDataPaths() {
  const config = fs.readJSONSync("foundryconfig.json");
  const dataPath = config?.dataPath;

  if (!dataPath) {
    throw new Error("No dataPath defined in foundryconfig.json");
  }

  const dataPaths = Array.isArray(dataPath) ? dataPath : [dataPath];

  return dataPaths.map((vdataPath) => {
    if (typeof vdataPath !== "string") {
      throw new TypeError(
        `Property dataPath in foundryconfig.json is expected to be a string or an array of strings, but found ${vdataPath}`,
      );
    }

    const resolvedPath = path.resolve(vdataPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`The dataPath ${vdataPath} does not exist on the file system`);
    }

    return path.basename(resolvedPath) === "Data" ? resolvedPath : path.resolve(resolvedPath, "Data");
  });
}

/**
 * Link build to User Data folder
 */
export async function link() {
  let destinationDirectory;
  if (fs.existsSync(path.resolve(sourceDirectory, "module.json"))) {
    destinationDirectory = "modules";
  } else {
    throw new Error("Could not find module.json");
  }

  const resolvedDistributionDirectory = path.resolve(distributionDirectory);
  if (!fs.existsSync(resolvedDistributionDirectory)) {
    throw new Error(`Could not find ${resolvedDistributionDirectory}. Run npm run build first.`);
  }

  const linkDirectories = getDataPaths().map((dataPath) => path.resolve(dataPath, destinationDirectory, packageId));

  const argv = yargs(hideBin(process.argv)).option("clean", {
    "alias": "c",
    "type": "boolean",
    "default": false,
  }).argv;
  const cclean = argv.c;

  for (const linkDirectory of linkDirectories) {
    if (cclean) {
      console.log(`Removing build in ${linkDirectory}.`);

      await fs.remove(linkDirectory);
    } else if (fs.existsSync(linkDirectory)) {
      console.log(`Skipped linking to ${linkDirectory}, as it already exists.`);
    } else {
      console.log(`Linking dist to ${linkDirectory}.`);
      await fs.ensureDir(path.resolve(linkDirectory, ".."));
      await fs.ensureSymlink(resolvedDistributionDirectory, linkDirectory, "dir");
    }
  }
}
