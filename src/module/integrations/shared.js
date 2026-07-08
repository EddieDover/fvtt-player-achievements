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

import { MODULE_NAME } from "../constants.js";
import { cleanString, enrichText } from "../utils.js";

/**
 * Build the achievement list markup for a character.
 * @param {Array} achievements - The achievements visible to the calling character
 * @param {string} actorUuid - The character's actor uuid
 * @returns {string} The list HTML
 */
export function buildAchievementList(achievements, actorUuid) {
  if (!achievements?.length) {
    return `<p class="pa-sheet-achievements__message">${game.i18n.localize(
      `${MODULE_NAME}.interface.achievements-none`,
    )}</p>`;
  }

  let listHtml = `<ul class="pa-sheet-achievements__list">`;
  for (const achievement of achievements) {
    const isCompleted = achievement.completedActors.includes(actorUuid);
    const title = enrichText(cleanString(achievement.title ?? ""));
    const description = enrichText(cleanString(achievement.description ?? ""));
    const earnedLabel = game.i18n.localize(`${MODULE_NAME}.interface.achievements-earned`);

    listHtml += `
      <li class="pa-sheet-achievements__item ${isCompleted ? "completed" : "locked"}">
        <img src="${achievement.image}" alt="${title}" width="48" height="48" />
        <div class="pa-sheet-achievements__details">
          <h4>${title}</h4>
          <div class="pa-sheet-achievements__description">${description}</div>
        </div>
        ${
          isCompleted
            ? `<i class="fa-solid fa-check-circle pa-sheet-achievements__earned" data-tooltip="${earnedLabel}" aria-label="${earnedLabel}"></i>`
            : ""
        }
      </li>`;
  }
  listHtml += `</ul>`;
  return listHtml;
}
