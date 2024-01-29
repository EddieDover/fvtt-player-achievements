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
import { MODULE_NAME, getAchivements, log, setupAchievementSocket } from "./core.js";

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
    awardAchievementToCharacter: PA_API.awardAchievementToCharacter,
    createAchievement: PA_API.createAchievement,
    editAchievement: PA_API.editAchievement,
    deleteAchievement: PA_API.deleteAchievement,
    doesCharacterHaveAchievement: PA_API.doesCharacterHaveAchievement,
    doesAchievementExist: PA_API.doesAchievementExist,
    getAchievementsByCharacter: PA_API.getAchievementsByCharacter,
    removeAchievementFromCharacter: PA_API.removeAchievementFromCharacter,
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

async function awardAchievement(achievementId, playerId) {
  const achievement = game.settings
    .get("fvtt-player-achievements", "customAchievements")
    .find((a) => a.id === achievementId);

  const playerOwner =
    game.users
      .filter((user) => user.active)
      .filter((user) => user.character)
      .find((user) => user.character.uuid === playerId) ?? undefined;
  if (!playerOwner) return;
  const player = playerOwner.character;
  const message = `
  <div class="achievement-message">
  <h2>Achievement Unlocked!</h2>
  <p>${player.name} (${playerOwner.name}) has unlocked</p>
  <hr/>
  <div class="achievement-message-container">
    <img src=${achievement.image} />
    <p>${achievement.title}</p>
  </div>
  <p class="achievement-message-description">${achievement.description}</p>
  </div>`;

  const showOnlyToAwardedUser = game.settings.get("fvtt-player-achievements", "showOnlyToAwardedUser");
  const whisper = showOnlyToAwardedUser ? [playerOwner.id] : [];
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker(),
    content: message,
    whisper: whisper,
  };
  ChatMessage.create(chatData, {});

  await achievement_socket.executeForEveryone("awardAchievementSelf", {
    achievement,
    playerId,
  });
}

async function awardAchievementSelf({ achievement, playerId }) {
  let playAwardSound = false;

  if (game.settings.get("fvtt-player-achievements", "playSelfSounds")) {
    playAwardSound = true;
  }

  if (game.user.character?.uuid === playerId && playAwardSound) {
    const audio = new Audio(achievement.sound ?? "/modules/fvtt-player-achievements/sounds/notification.ogg");
    audio.volume = game.settings.get("fvtt-player-achievements", "selfSoundVolume");
    audio.play();
  }
}

async function getAchivements(overrides) {
  let callingUser;
  let callingCharacterId = "";
  if (overrides?.callingUser) {
    callingUser = overrides.callingUser;
    callingCharacterId = overrides.callingCharacterId;
  } else {
    callingUser = game.user;
    callingCharacterId = "";
  }

  if (!game.user.isGM) {
    return await achievement_socket.executeAsGM("getAchievements", {
      callingUser: game.user,
      callingCharacterId: `Actor.${game.user.character.id}` ?? "",
    });
  }

  let achievements = hydrateAwardedAchievements(
    game.settings.get("fvtt-player-achievements", "awardedAchievements") ?? {},
  );

  achievements.map((achievement) => {
    if (achievement.image == "") {
      achievement.image = "modules/fvtt-player-achievements/images/default.webp";
    }
    if (achievement.cloakedImage == "") {
      achievement.cloakedImage = "modules/fvtt-player-achievements/images/default.webp";
    }
  });

  const hideUnearnedAchievements = game.settings.get("fvtt-player-achievements", "hideUnearnedAchievements");
  const cloakUnearnedAchievements = game.settings.get("fvtt-player-achievements", "cloakUnearnedAchievements");

  let retachievements = deepCopy(achievements);
  if (!callingUser.isGM) {
    if (hideUnearnedAchievements) {
      retachievements = retachievements.filter((achievement) =>
        achievement.completedActors.includes(callingCharacterId),
      );
    } else if (cloakUnearnedAchievements) {
      retachievements = retachievements.map((achievement) => {
        if (!achievement.completedActors.includes(callingCharacterId)) {
          if (!achievement.showTitleCloaked) {
            achievement.title = "HIDDEN";
          }
          achievement.description = "HIDDEN";
          achievement.image = achievement.cloakedImage ?? "modules/fvtt-player-achievements/images/default.webp";
        }
        return achievement;
      });
    }
  }

  const achievementIds = retachievements.map((achievement) => achievement.id);
  const uniqueAchievementIds = [...new Set(achievementIds)];
  if (achievementIds.length !== uniqueAchievementIds.length) {
    throw new Error("Duplicate achievement ids found");
  }
  return retachievements;
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
