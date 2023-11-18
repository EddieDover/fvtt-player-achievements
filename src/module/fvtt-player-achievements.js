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
import { deepCopy } from "./utils.js";

let currentAchievementScreen;
let achievement_socket;
let MODULE_NAME = "fvtt-player-achievements";

function log(...message) {
  console.log(`${MODULE_NAME} |`, message);
}

/* Handlebars */

Handlebars.registerHelper("ownedPlayers", function (playerIds, players, options) {
  let result = "";
  for (const player of players.filter((player) => playerIds.includes(player.uuid))) {
    result += options.fn(player);
  }

  return result;
});

Handlebars.registerHelper("ownedPlayersCount", function (playerIds, players, options) {
  return players?.filter((player) => playerIds.includes(player.uuid)).length ?? 0 > 0
    ? options.fn(this)
    : options.inverse(this);
});

Handlebars.registerHelper("unownedPlayersCount", function (playerIds, players, options) {
  return players?.filter((player) => !playerIds.includes(player.uuid)).length ?? 0 > 0
    ? options.fn(this)
    : options.inverse(this);
});

Handlebars.registerHelper("unownedPlayers", function (playerIds, players, options) {
  let result = "";

  for (const player of players.filter((player) => !playerIds.includes(player.uuid))) {
    result += options.fn(player);
  }

  return result;
});

Handlebars.registerHelper("ifcompachi", function (achievement, myuuid, options) {
  return achievement.completedActors.includes(myuuid) ? options.fn(this) : options.inverse(this);
});

/* Functions */

async function toggleAchievementScreen() {
  if (currentAchievementScreen?.rendered) {
    currentAchievementScreen.close();
  } else {
    const overrides = {
      updateAchievements: async () => {
        return await getAchivements();
      },
      processAward: async (achievementId, playerId) => {
        // Hooks.call("fvtt-player-achievements.beforeAchievementBestowed", achievementId, playerId);
        return await awardAchievement(achievementId, playerId);
        // Hooks.call("fvtt-player-achievements.afterAchievementBestowed", achievementId, playerId);
        // return;
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
    <img src=${achievement.image}/>
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

function hydrateAwardedAchievements(awardedAchievements) {
  const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements") ?? [];
  const hydratedAchievements = customAchievements.map((achievement) => {
    achievement.completedActors = awardedAchievements[achievement.id] ?? [];
    return achievement;
  });
  return hydratedAchievements;
}

/* Hooks */

Hooks.once("socketlib.ready", () => {
  achievement_socket = socketlib.registerModule("fvtt-player-achievements");
  achievement_socket.register("getAchievements", getAchivements);
  achievement_socket.register("awardAchievement", (data) => {
    awardAchievement(data.achievementId, data.playerId);
  });
  achievement_socket.register("awardAchievementSelf", awardAchievementSelf);
});

Hooks.on("init", async () => {
  log("Initializing");

  const achievementblock = await fetch("modules/fvtt-player-achievements/templates/achievement-block.hbs").then((r) =>
    r.text(),
  );

  Handlebars.registerPartial("achievement-block", achievementblock);

  registerSettings();
});

Hooks.on("ready", async () => {
  log("Ready");
});

Hooks.on("renderSceneNavigation", () => {});

Hooks.on("renderSceneControls", () => {
  let button = document.querySelector("#AchievementButton");
  const controls = $(".main-controls.app.control-tools.flexcol");

  if (controls && !button) {
    const newli = document.createElement("li");
    newli.classList.add("control-tool");
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
