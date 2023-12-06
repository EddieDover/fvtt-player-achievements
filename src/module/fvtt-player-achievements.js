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

import { AchievementForm } from "./app/achievement-form.js";
import { registerSettings } from "./app/settings.js";
import PA_API from "./api.js";
import { MODULE_NAME, awardAchievementMessage, getAchivements, log, setupAchievementSocket } from "./core.js";

let currentAchievementScreen;
var registeredHandlebars = false;

/* Handlebars */

/**
 * Register Handlebar Helpers
 */
function registerHandlebarHelpers() {
  if (registeredHandlebars) {
    return;
  }
  registeredHandlebars = true;
  Handlebars.registerHelper("ownedCharacters", function (characterIds, characters, options) {
    let result = "";
    for (const character of characters.filter((cha) => characterIds.includes(cha.uuid))) {
      result += options.fn(character);
    }

    return result;
  });

  Handlebars.registerHelper("ownedCharactersCount", function (characterIds, characters, options) {
    return characters?.filter((character) => characterIds.includes(character.uuid)).length ?? 0 > 0
      ? options.fn(this)
      : options.inverse(this);
  });

  Handlebars.registerHelper("unownedCharactersCount", function (characterIds, characters, options) {
    return characters?.filter((character) => !characterIds.includes(character.uuid)).length ?? 0 > 0
      ? options.fn(this)
      : options.inverse(this);
  });

  Handlebars.registerHelper("unownedCharacters", function (characterIds, characters, options) {
    let result = "";

    for (const character of characters.filter((character) => !characterIds.includes(character.uuid))) {
      result += options.fn(character);
    }

    return result;
  });

  Handlebars.registerHelper("ifcompachi", function (achievement, myuuid, options) {
    return achievement.completedActors.includes(myuuid) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("iflockedachi", function (achievement_id, options) {
    const lockedAchievements = game.settings.get("fvtt-player-achievements", "lockedAchievements") ?? [];
    return lockedAchievements.includes(achievement_id) ? options.fn(this) : options.inverse(this);
  });
}

/**
 * Register the API
 */
function registerAPI() {
  game[MODULE_NAME] = {};
  game[MODULE_NAME].api = {
    getAchievements: PA_API.getAchievements,
    actorHasAchievement: PA_API.actorHasAchievement,
  };
  log("API Registered");
}

/* Functions */

/**
 * Toggle the Achievement Screen
 */
async function toggleAchievementScreen() {
  if (currentAchievementScreen?.rendered) {
    currentAchievementScreen.close();
  } else {
    const overrides = {
      updateAchievements: async () => {
        return getAchivements();
      },
    };
    currentAchievementScreen = new AchievementForm(overrides);
    currentAchievementScreen.render(true);
  }
}

/* Hooks */

Hooks.once("socketlib.ready", () => {
  setupAchievementSocket();
});

Hooks.on("init", async () => {
  log("Initializing");

  registerSettings();

  const achievementblock = await fetch("modules/fvtt-player-achievements/templates/achievement-block.hbs").then((r) =>
    r.text(),
  );

  Handlebars.registerPartial("achievement-block", achievementblock);
});

Hooks.on("ready", async () => {
  log("Ready");
  registerHandlebarHelpers();
  registerAPI();
});

Hooks.on("renderSceneNavigation", () => {});

Hooks.on("renderSceneControls", () => {
  let button = document.querySelector("#AchievementButton");
  const controls = $(".main-controls.app.control-tools.flexcol");

  if (controls && !button) {
    const newli = document.createElement("li");
    newli.classList.add("scene-control");
    newli.id = "AchievementButton";
    newli.dataset.tool = "AchievementSheet";
    newli.setAttribute("aria-label", "Show Achievement Sheet");
    newli.setAttribute("role", "button");
    newli.dataset.tooltip = "Achievement Sheet";
    newli.innerHTML = `<i class="fas fa-trophy"></i>`;
    newli.addEventListener("click", async () => {
      await toggleAchievementScreen();
    });
    controls.append(newli);
  }
});

Hooks.on("renderPlayerList", () => {
  if (currentAchievementScreen?.rendered) {
    currentAchievementScreen.render(true);
  }
});
