/*
 Copyright (c) 2023 Eddie Dover

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const replaceMap = [
  { from: "{i}", to: "<i>" },
  { from: "{/i}", to: "</i>" },
  { from: "{b}", to: "<b>" },
  { from: "{/b}", to: "</b>" },
  { from: "{nl}", to: "<br>" },
];

/**
 * Perform a deep copy of an object
 * @param {any} object Object to deep copy
 * @returns {any} Deep copied object
 */
export function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * Localize a string
 * @param {string} key localization key
 * @returns {string} localized string
 */
export function localize(key) {
  return game.i18n.localize(key);
}

/**
 * Hydrate achievements with awarded actors
 * @param {Array} awardedAchievements Array of awarded achievements
 * @returns {Array} hydratedAchievements
 */
export function hydrateAwardedAchievements(awardedAchievements) {
  const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements") ?? [];
  const hydratedAchievements = customAchievements.map((achievement) => {
    achievement.completedActors = awardedAchievements[achievement.id] ?? [];
    return achievement;
  });
  return hydratedAchievements;
}

/**
 * Enrich text with additional formatting
 * @param {string} text Text to enrich
 * @returns {string} enrichedText Enriched text
 */
export function enrichText(text) {
  let enrichedText = text;
  for (const replace of replaceMap) {
    enrichedText = enrichedText.replaceAll(replace.from, replace.to);
  }
  return enrichedText;
}

/**
 * Clean a string of html injection.
 * @param {string} text - The string to clean
 * @returns {string} The cleaned string
 */
export function cleanString(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
