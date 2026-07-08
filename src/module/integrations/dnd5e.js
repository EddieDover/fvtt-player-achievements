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
import { getAchievements } from "../core.js";
import { buildAchievementList } from "./shared.js";

/**
 * Register the dnd5e character-sheet integration.
 * Supports the ApplicationV2 character sheet introduced in dnd5e 5.x.
 */
export function registerDnd5eIntegration() {
  Hooks.on("renderCharacterActorSheet", onRenderCharacterSheet);
}

/**
 * Inject the Achievements tab into a rendered dnd5e character sheet.
 * @param {*} app - The character sheet application
 * @param {*} element - The sheet's rendered HTML element
 */
async function onRenderCharacterSheet(app, element) {
  if (app.actor?.type !== "character") return;

  const nav = element.querySelector('nav.tabs[data-group="primary"]');
  const tabBody = element.querySelector(".tab-body");
  if (!nav || !tabBody) return;

  const isActive = app.tabGroups?.primary === "achievements";
  const localizedLabel = game.i18n.localize(`${MODULE_NAME}.interface.achievements`);

  if (!nav.querySelector('[data-tab="achievements"]')) {
    const tabTrigger = document.createElement("a");
    tabTrigger.classList.add("item", "control");
    if (isActive) tabTrigger.classList.add("active");
    tabTrigger.dataset.action = "tab";
    tabTrigger.dataset.group = "primary";
    tabTrigger.dataset.tab = "achievements";
    tabTrigger.dataset.tooltip = "";
    tabTrigger.setAttribute("aria-label", localizedLabel);
    tabTrigger.innerHTML = `<i class="fas fa-trophy" inert></i>`;
    nav.append(tabTrigger);
  }

  let tabContent = tabBody.querySelector('section.tab[data-tab="achievements"]');
  if (!tabContent) {
    tabContent = document.createElement("section");
    tabContent.classList.add("tab", "achievements");
    if (isActive) tabContent.classList.add("active");
    tabContent.dataset.group = "primary";
    tabContent.dataset.tab = "achievements";
    tabContent.innerHTML = `
      <fieldset class="card">
        <legend>${localizedLabel}</legend>
        <div class="pa-sheet-achievements"></div>
      </fieldset>`;
    tabBody.append(tabContent);
  }

  const list = tabContent.querySelector(".pa-sheet-achievements");

  try {
    const achievements = await getAchievements({ callingCharacterId: app.actor.uuid });
    list.innerHTML = buildAchievementList(achievements, app.actor.uuid);
  } catch (error) {
    console.error(`${MODULE_NAME} | Error rendering achievements tab:`, error);
    list.innerHTML = `<p class="pa-sheet-achievements__message pa-sheet-achievements__message--error">${game.i18n.localize(
      `${MODULE_NAME}.interface.achievements-error`,
    )}</p>`;
  }
}
