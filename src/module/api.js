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
  deleteAchievement as prime_deleteAchievement,
  DEFAULT_IMAGE,
  DEFAULT_SOUND,
  doesActorExist,
  generateUniqueId,
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

const assureActorUUID = (id) => {
  return id.startsWith("Actor.") ? id : `Actor.${id}`;
};

/**
 * @namespace
 */
const PlayerAchievementsAPI = (function () {
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
      getAchievements().payload.some((a) => a.id === achievementId),
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
    const cuuid = assureActorUUID(characterUUID);
    const achievement = getAchievements().payload.find((a) => a.id === achievementId);
    if (!achievement) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    if (!doesActorExist(cuuid)) {
      return createReturnPayload("Character does not exist.", false);
    }

    return createReturnPayload("", achievement.completedActors.includes(cuuid));
  }

  /**
   * Award the achievement to the character
   * @memberof PlayerAchievementsAPI
   * @param {string} achievementId The achievement id
   * @param {string} characterUUID The character uuid
   * @returns { PlayerAchievementReturn<boolean> } Was the achievement awarded?
   */
  function awardAchievementToCharacter(achievementId, characterUUID) {
    const cuuid = assureActorUUID(characterUUID);
    const achievement = getAchievements().payload.find((a) => a.id === achievementId);
    if (!achievement) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    if (!doesActorExist(cuuid)) {
      return createReturnPayload("Character does not exist.", false);
    }

    if (doesCharacterHaveAchievement(cuuid, achievementId).payload) {
      return createReturnPayload("Character already has achievement.", false);
    }

    prime_awardAchievement(achievementId, cuuid);
    return createReturnPayload("", true);
  }

  /**
   * Remove an achievement from the character
   * @param {string} achievementId The achievement id
   * @param {string} characterUUID The character uuid
   * @returns { PlayerAchievementReturn<boolean> } Was the achievement removed?
   */
  function removeAchievementFromCharacter(achievementId, characterUUID) {
    const cuuid = assureActorUUID(characterUUID);
    const achievement = getAchievements().payload.find((a) => a.id === achievementId);
    if (!achievement) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    if (!doesActorExist(cuuid)) {
      return createReturnPayload("Character does not exist.", false);
    }

    if (!doesCharacterHaveAchievement(cuuid, achievementId).payload) {
      return createReturnPayload("Character does not have achievement.", false);
    }

    prime_unAwardAchievement(achievementId, cuuid);
    return createReturnPayload("", true);
  }

  /**
   * Get the achievements for the character
   * @memberof PlayerAchievementsAPI
   * @param {string} characterUUID The character uuid
   * @returns { PlayerAchievementReturn<Array<Achievement>> } achievements for the character
   */
  function getAchievementsByCharacter(characterUUID) {
    const cuuid = assureActorUUID(characterUUID);
    return createReturnPayload(
      "",
      getAchievements().payload.filter((a) => a.completedActors.includes(cuuid)),
    );
  }

  /**
   * Create an achievement
   * @memberof PlayerAchievementsAPI
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {string} description The achievement description
   * @param {boolean} showTitleCloaked Show the title cloaked?
   * @param {string} image The achievement image
   * @param {string} cloakedImage The achievement cloaked image
   * @param {string} sound The achievement sound effect
   * @param {Array<string>} tags The achievement tags
   * @returns { PlayerAchievementReturn<string> } The ID of the achievement
   */
  async function createAchievement(
    id,
    title,
    description,
    showTitleCloaked = false,
    image = DEFAULT_IMAGE,
    cloakedImage = DEFAULT_IMAGE,
    sound = DEFAULT_SOUND,
    tags = [],
  ) {
    if (!id) {
      id = await generateUniqueId();
    }
    if (!title || !description || !image || !cloakedImage || !sound || !tags) {
      return createReturnPayload("Missing required field(s).", "");
    }

    if (doesAchievementExist(id).payload === true) {
      return createReturnPayload("Achievement already exists.", "");
    }

    const achievement = {
      id,
      title,
      showTitleCloaked,
      description,
      image,
      cloakedImage,
      sound,
      tags,
    };

    prime_createAchievement(achievement);
    return createReturnPayload("", id);
  }

  /**
   * Delete an achievement
   * @param {string} id The achievement id
   * @returns {PlayerAchievementReturn<boolean>} Was the achievement deleted?
   */
  function deleteAchievement(id) {
    if (!id) {
      return createReturnPayload("Missing required field(s).", false);
    }

    if (!doesAchievementExist(id).payload === true) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    prime_deleteAchievement(id);
    return createReturnPayload("", true);
  }

  /**
   * Edit an achievement
   * @memberof PlayerAchievementsAPI
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {string} description The achievement description
   * @param {boolean} showTitleCloaked Show the title cloaked?
   * @param {string} image The achievement image
   * @param {string} cloakedImage The achievement cloaked image
   * @param {string} sound The achievement sound effect
   * @param {Array<string>} tags The achievement tags
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
    tags = [],
  ) {
    if (!id || !title || !description || !image || !cloakedImage || !sound || !tags) {
      return createReturnPayload("Missing required field(s).", false);
    }

    if (!doesAchievementExist(id).payload === true) {
      return createReturnPayload("Achievement does not exist.", false);
    }

    const achievement = {
      id,
      title,
      showTitleCloaked,
      description,
      image,
      cloakedImage,
      sound,
      tags,
    };

    prime_editAchievement(achievement);
    return createReturnPayload("", true);
  }

  return {
    awardAchievementToCharacter,
    createAchievement,
    editAchievement,
    deleteAchievement,
    doesCharacterHaveAchievement,
    doesAchievementExist,
    getAchievements,
    getAchievementsByCharacter,
    removeAchievementFromCharacter,
  };
})();

export default PlayerAchievementsAPI;
