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

export const MODULE_NAME = "fvtt-player-achievements";
export const DEFAULT_IMAGE = "/modules/fvtt-player-achievements/images/default.webp";
export const DEFAULT_SOUND = "/modules/fvtt-player-achievements/sounds/notification.ogg";

import { deepCopy, hydrateAwardedAchievements } from "./utils.js";
let achievement_socket;

/**
 * Log a message to the console
 * @param {any} message The message to log
 */
export function log(...message) {
  console.log(`${MODULE_NAME} |`, message);
}

/**
 * Setup the Achievement Data Socket
 */
export function setupAchievementSocket() {
  achievement_socket = socketlib.registerModule("fvtt-player-achievements");
  achievement_socket.register("getAchievements", getAchivements);
  achievement_socket.register("awardAchievement", (data) => {
    awardAchievementMessage(data.achievementId, data.characterId);
  });
  achievement_socket.register("awardAchievementSelf", awardAchievementSelf);
}

/**
 * Achievement Interface
 * @interface Achievement
 * @property {string} id Unique ID
 * @property {string} title Title
 * @property {string} description Description
 * @property {string} image Image URL
 * @property {string} cloakedImage Cloaked Image URL
 * @property {string} sound Sound Effect URL
 * @property {Array} completedActors Array of Actor UUIDs
 * @property {boolean} showTitleCloaked Show Title Cloaked
 * @property {Array<string>} tags Tags
 */

/**
 * Create an Achievement
 * @param {Achievement} achievement The achievement
 */
export function createAchievement({ id, title, showTitleCloaked, description, image, cloakedImage, sound, tags }) {
  const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements");
  customAchievements.push({
    id,
    title,
    showTitleCloaked,
    description,
    image: image ?? DEFAULT_IMAGE,
    cloakedImage: cloakedImage ?? DEFAULT_IMAGE,
    sound: sound ?? DEFAULT_SOUND,
    tags,
  });
  game.settings.set("fvtt-player-achievements", "customAchievements", customAchievements);
}

/**
 * Edit an Achievement
 * @param {Achievement} achievement The achievement
 */
export function editAchievement({ id, title, showTitleCloaked, description, image, cloakedImage, sound, taqs }) {
  const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements");
  const index = customAchievements.findIndex((a) => a.id === id);
  if (index === -1) {
    return;
  }
  customAchievements[index] = { id, title, showTitleCloaked, description, image, cloakedImage, sound, tags };
  game.settings.set("fvtt-player-achievements", "customAchievements", customAchievements);
}

/**
 * Delete an Achievement
 * @param {string} achievementId The achievement id
 */
export function deleteAchievement(achievementId) {
  const achievements = game.settings.get("fvtt-player-achievements", "customAchievements");
  const index = achievements.findIndex((a) => a.id === achievementId);
  achievements.splice(index, 1);
  game.settings.set("fvtt-player-achievements", "customAchievements", achievements);

  const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");

  for (const [aid, _character] of Object.entries(awardedAchievements)) {
    if (aid === achievementId) {
      delete awardedAchievements[achievementId];
    }
  }
  game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);
}

/**
 * Get the array of Achievements
 * @param {{}} overrides Overrides
 * @returns {Array<Achievement>} The array of Achievements
 */
export async function getAchivements(overrides) {
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
      callingCharacterId: `Actor.${game.user?.character?.id ?? ""}`,
    });
  }

  let achievements = hydrateAwardedAchievements(
    game.settings.get("fvtt-player-achievements", "awardedAchievements") ?? {},
  );

  for (const achievement of achievements) {
    if (achievement.image == "") {
      achievement.image = "modules/fvtt-player-achievements/images/default.webp";
    }
    if (achievement.cloakedImage == "") {
      achievement.cloakedImage = "modules/fvtt-player-achievements/images/default.webp";
    }
  }

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

/**
 * Displays visual message of award achievement
 * @param {string} achievementId The achievement id
 * @param {string} characterId The chacter id
 */
export async function awardAchievementMessage(achievementId, characterId) {
  const achievement = game.settings
    .get("fvtt-player-achievements", "customAchievements")
    .find((a) => a.id === achievementId);

  const playerOwner =
    game.users
      .filter((user) => user.active)
      .filter((user) => user.character)
      .find((user) => user.character.uuid === characterId) ?? undefined;
  if (!playerOwner) return;
  const character = playerOwner.character;
  const message = `
  <div class="achievement-message">
  <h2>Achievement Unlocked!</h2>
  <p>${character.name} (${playerOwner.name}) has unlocked</p>
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
    characterId,
  });
}

/**
 * Award an achievement to self
 * @param {{ achievement: string, characterId: string }} data Achievement and Character ID
 */
async function awardAchievementSelf({ achievement, characterId }) {
  let playAwardSound = false;

  if (game.settings.get("fvtt-player-achievements", "playSelfSounds")) {
    playAwardSound = true;
  }

  if (game.user.character?.uuid === characterId && playAwardSound) {
    const audio = new Audio(achievement.sound ?? "/modules/fvtt-player-achievements/sounds/notification.ogg");
    audio.volume = game.settings.get("fvtt-player-achievements", "selfSoundVolume");
    audio.play();
  }
}

/**
 * AWards an achievement to the actor
 * @param {string} achievementId The achievement id
 * @param {string} characterId The character id
 */
export function awardAchievement(achievementId, characterId) {
  const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");
  const awardBlock = awardedAchievements[achievementId] ?? [];
  let characters = [...awardBlock];
  characters.push(characterId);
  characters = [...new Set(characters)];
  awardedAchievements[achievementId] = characters;
  game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);
  awardAchievementMessage(achievementId, characterId);
  Hooks.call(MODULE_NAME + ".awardAchievement", achievementId, characterId);
}

/**
 * Removes an achievement from the actor
 * @param {string} achievementId The achievement id
 * @param {string} characterIds The character id
 */
export function unAwardAchievement(achievementId, characterIds) {
  const awardedAchievements = { ...game.settings.get("fvtt-player-achievements", "awardedAchievements") };
  const awardedCharacters = [...awardedAchievements[achievementId]];

  const cids = Array.isArray(characterIds) ? characterIds : [characterIds];

  for (const characterId of cids) {
    for (const [index, awardedCharacterId] of awardedCharacters.entries()) {
      if (awardedCharacterId === characterId) {
        awardedCharacters.splice(index, 1);
      }
    }
  }

  awardedAchievements[achievementId] = awardedCharacters;
  game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);

  const hydratedAchievements = hydrateAwardedAchievements(awardedAchievements);
  game.settings.set("fvtt-player-achievements", "customAchievements", hydratedAchievements);

  for (const characterId of cids) {
    Hooks.call(MODULE_NAME + ".unAwardAchievement", achievementId, characterId);
  }
}

/**
 * Does the actor exist?
 * @param {string} actorId The actor id
 * @returns {boolean} Does the actor exist?
 */
export function doesActorExist(actorId) {
  const nonNPCActors = game.actors.filter((actor) => actor.type !== "npc");
  return nonNPCActors.filter((actor) => actor.uuid === actorId).length == 1;
}
