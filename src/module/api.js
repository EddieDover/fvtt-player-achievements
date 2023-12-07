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

import {
  awardAchievement as prime_awardAchievement,
  unAwardAchievement as prime_unAwardAchievement,
  createAchievement as prime_createAchievement,
  editAchievement as prime_editAchievement,
} from "./core";

const createReturnPayload = (errorMessage, payload) => {
  return {
    errorMessage,
    payload,
  };
};

/**
 * @typedef {object} Achievement
 * @property {string} id The achievement id
 * @property {string} title The achievement title
 * @property {boolean} showTitleCloaked Show the title cloaked?
 * @property {string} description The achievement description
 * @property {string} image The achievement image
 * @property {string} cloakedImage The achievement cloaked image
 * @property {string} sound The achievement sound effect
 */

/**
 * @interface PlayerAchievementReturn
 * @property {string} errorMessage - The error message
 * @property {T} payload - The payload
 * @template T
 */

/**
 * @namespace
 */
const PlayerAchievementsAPI = (function () {
  const DEFAULT_SOUND = "/modules/fvtt-player-achievements/sounds/notification.ogg";
  const DEFAULT_IMAGE = "/modules/fvtt-player-achievements/images/default.webp";

  /**
   * Returns the achievements array
   * @memberof PlayerAchievementsAPI
   * @returns { PlayerAchievementReturn<Array<Achievement>> } Achievements List
   */
  function getAchievements() {
    return createReturnPayload("", game.settings.get("fvtt-player-achievements", "customAchievements"));
  }

  /**
   * Does the achievement exist?
   * @memberof PlayerAchievementsAPI
   * @param {string} achievementId The achievement id
   * @returns { PlayerAchievementReturn<boolean> } Does the achievement exist?
   */
  function doesAchievementExist(achievementId) {
    return createReturnPayload(
      "",
      getAchievements().some((a) => a.id === achievementId),
    );
  }

  /**
   * Does the character have the achievement?
   * @memberof PlayerAchievementsAPI
   * @param {string} characterUUID The character uuid
   * @param {string} achievementId The achievement id
   * @returns { PlayerAchievementReturn<boolean> } Does the character have the achievement?
   */
  function doesCharacterHaveAchievement(characterUUID, achievementId) {
    const achievement = getAchievements().find((a) => a.id === achievementId);
    if (!achievement) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    return createReturnPayload("", achievement.completedActors.includes(characterUUID));
  }

  /**
   * Award the achievement to the character
   * @memberof PlayerAchievementsAPI
   * @param {string} achievementId The achievement id
   * @param {string} characterUUID The character uuid
   * @returns { PlayerAchievementReturn<boolean> } Was the achievement awarded?
   */
  function awardAchievementToCharacter(achievementId, characterUUID) {
    const achievement = getAchievements().find((a) => a.id === achievementId);
    if (!achievement) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    prime_awardAchievement(achievementId, characterUUID);
    return createReturnPayload("", true);
  }

  /**
   * Remove an achievement from the character
   * @param {string} achievementId The achievement id
   * @param {string} characterUUID The character uuid
   * @returns { PlayerAchievementReturn<boolean> } Was the achievement removed?
   */
  async function removeAchievementFromCharacter(achievementId, characterUUID) {
    const achievement = getAchievements().find((a) => a.id === achievementId);
    if (!achievement) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    prime_unAwardAchievement(achievementId, characterUUID);
    return createReturnPayload("", true);
  }

  /**
   * Get the achievements for the character
   * @memberof PlayerAchievementsAPI
   * @param {string} characterUUID The character uuid
   * @returns { PlayerAchievementReturn<Array<Achievement>> } achievements for the character
   */
  function getAchievementsByCharacter(characterUUID) {
    return createReturnPayload(
      "",
      getAchievements().filter((a) => a.completedActors.includes(characterUUID)),
    );
  }

  /**
   * Create an achievement
   * @memberof PlayerAchievementsAPI
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {string} description The achievement description
   * @param {boolean} [showTitleCloaked=false] Show the title cloaked?
   * @param {string} [image="/modules/fvtt-player-achievements/images/default.webp"] The achievement image
   * @param {string} [cloakedImage="/modules/fvtt-player-achievements/images/default.webp"] The achievement cloaked image
   * @param {string} [sound="/modules/fvtt-player-achievements/sounds/notification.ogg"] The achievement sound effect
   * @returns { PlayerAchievementReturn<boolean> } Was the achievement created?
   */
  function createAchievement(
    id,
    title,
    description,
    showTitleCloaked = false,
    image = DEFAULT_IMAGE,
    cloakedImage = DEFAULT_IMAGE,
    sound = DEFAULT_SOUND,
  ) {
    if (!id || !title || !description || !image || !cloakedImage || !sound) {
      return createReturnPayload("Missing required field(s).", false);
    }

    const achievement = {
      id,
      title,
      showTitleCloaked,
      description,
      image,
      cloakedImage,
      sound,
    };

    prime_createAchievement(achievement);
    return createReturnPayload("", true);
  }

  /**
   * Edit an achievement
   * @memberof PlayerAchievementsAPI
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {string} description The achievement description
   * @param {boolean} [showTitleCloaked=false] Show the title cloaked?
   * @param {string} [image="/modules/fvtt-player-achievements/images/default.webp"] The achievement image
   * @param {string} [cloakedImage="/modules/fvtt-player-achievements/images/default.webp"] The achievement cloaked image
   * @param {string} [sound="/modules/fvtt-player-achievements/sounds/notification.ogg"] The achievement sound effect
   * @returns { PlayerAchievementReturn<boolean> } Was the achievement edited?
   */
  function editAchievement(
    id,
    title,
    description,
    showTitleCloaked = false,
    image = DEFAULT_IMAGE,
    cloakedImage = DEFAULT_IMAGE,
    sound = DEFAULT_SOUND,
  ) {
    if (!id || !title || !description || !image || !cloakedImage || !sound) {
      return createReturnPayload("Missing required field(s).", false);
    }

    const achievement = {
      id,
      title,
      showTitleCloaked,
      description,
      image,
      cloakedImage,
      sound,
    };

    prime_editAchievement(achievement);
    return createReturnPayload("", true);
  }

  return {
    awardAchievementToCharacter,
    createAchievement,
    editAchievement,
    doesCharacterHaveAchievement,
    doesAchievementExist,
    getAchievements,
    getAchievementsByCharacter,
    removeAchievementFromCharacter,
  };
})();

export default PlayerAchievementsAPI;
