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
import { getAchivements, getPendingAchievements, log, setupAchievementSocket } from "./core.js";
import { enrichText } from "./utils.js";
import { MODULE_NAME } from "./constants.js";

let currentAchievementScreen;
let registeredHandlebars = false;

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
    return (characters?.filter((character) => characterIds.includes(character.uuid)).length ?? 0) > 0
      ? options.fn(this)
      : options.inverse(this);
  });

  Handlebars.registerHelper("unownedCharactersCount", function (characterIds, characters, options) {
    return (characters?.filter((character) => !characterIds.includes(character.uuid)).length ?? 0) > 0
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

  Handlebars.registerHelper("enrichText", function (text) {
    return new Handlebars.SafeString(enrichText(Handlebars.escapeExpression(text)));
  });

  Handlebars.registerHelper("inStringArray", function (stringArray, string, options) {
    return stringArray.includes(string) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifgte", function (v1, v2, options) {
    if (v1 >= v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
}

/**
 * Register the API
 */
function registerAPI() {
  game[MODULE_NAME] = {};
  game[MODULE_NAME].api = {
    getAchievements: PA_API.getAchievements,
    awardAchievementToCharacter: PA_API.awardAchievementToCharacter,
    createAchievement: PA_API.createAchievement,
    editAchievement: PA_API.editAchievement,
    deleteAchievement: PA_API.deleteAchievement,
    doesCharacterHaveAchievement: PA_API.doesCharacterHaveAchievement,
    doesAchievementExist: PA_API.doesAchievementExist,
    getAchievementsByCharacter: PA_API.getAchievementsByCharacter,
    removeAchievementFromCharacter: PA_API.removeAchievementFromCharacter,
    toggleAchievementWindow: () => {
      showWindow();
    },
  };
  log("API Registered");
}

/* Functions */

/**
 * Toggle the Achievement Screen
 */
function toggleAchievementScreen() {
  if (currentAchievementScreen?.rendered) {
    currentAchievementScreen.close();
  } else {
    const overrides = {
      updateAchievements: () => {
        return getAchivements();
      },
    };
    currentAchievementScreen = new AchievementForm(overrides);
    currentAchievementScreen.render(true);
  }
}

/**
 * Displays the Achievement Window
 */
function showWindow() {
  toggleAchievementScreen();
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

Hooks.on("ready", () => {
  log("Ready");
  registerHandlebarHelpers();
  registerAPI();

  if (!game.user.isGM) {
    getPendingAchievements();
  }
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
    newli.addEventListener("click", showWindow);
    controls.append(newli);
  }
});

Hooks.on("renderPlayerList", () => {
  if (currentAchievementScreen?.rendered) {
    currentAchievementScreen.render(true);
  }
});
