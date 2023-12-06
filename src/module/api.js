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

/**
 * @namespace
 */
const PlayerAchievementsAPI = (function () {
  /**
   * Returns the achievements array
   * @memberof PlayerAchievementsAPI
   * @returns {Array} Achievements List
   */
  function getAchievements() {
    return game.settings.get("fvtt-player-achievements", "customAchievements");
  }

  /**
   * Does the achievement exist?
   * @memberof PlayerAchievementsAPI
   * @param {string} achievementId The achievement id
   * @returns {boolean} Does the achievement exist?
   */
  function doesAchievementExist(achievementId) {
    return getAchievements().some((a) => a.id === achievementId);
  }

  /**
   * Does the character have the achievement?
   * @memberof PlayerAchievementsAPI
   * @param {string} characterUUID The character uuid
   * @param {string} achievementId The achievement id
   * @returns {boolean} Does the character have the achievement?
   */
  function doesCharacterHaveAchievement(characterUUID, achievementId) {
    const achievement = getAchievements().find((a) => a.id === achievementId);
    if (!achievement) {
      return false;
    }

    return achievement.completedActors.includes(characterUUID);
  }

  /**
   * Award the achievement to the character
   * @memberof PlayerAchievementsAPI
   * @param {string} achievementId The achievement id
   * @param {string} characterUUID The character uuid
   * @returns {boolean} Was the achievement awarded?
   */
  function awardAchievementToCharacter(achievementId, characterUUID) {
    const achievement = getAchievements().find((a) => a.id === achievementId);
    if (!achievement) {
      return false;
    }

    prime_awardAchievement(achievementId, characterUUID);
    return true;
  }

  /**
   * Remove an achievement from the character
   * @param {string} achievementId The achievement id
   * @param {string} characterUUID The character uuid
   * @returns {boolean} Was the achievement removed?
   */
  async function removeAchievementFromCharacter(achievementId, characterUUID) {
    const achievement = getAchievements().find((a) => a.id === achievementId);
    if (!achievement) {
      return false;
    }

    prime_unAwardAchievement(achievementId, characterUUID);
    return true;
  }

  /**
   * Get the achievements for the character
   * @memberof PlayerAchievementsAPI
   * @param {string} characterUUID The character uuid
   * @returns {Array} achievements for the character
   */
  function getAchievementsByCharacter(characterUUID) {
    return getAchievements().filter((a) => a.completedActors.includes(characterUUID));
  }

  /**
   * Create an achievement
   * @memberof PlayerAchievementsAPI
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {boolean} showTitleCloaked Show the title cloaked?
   * @param {string} description The achievement description
   * @param {string} image The achievement image
   * @param {string} cloakedImage The achievement cloaked image
   * @param {string} soundEffect The achievement sound effect
   * @returns {boolean} Was the achievement created?
   */
  function createAchievement(id, title, showTitleCloaked, description, image, cloakedImage, soundEffect) {
    if (!id || !title || !description || !image || !cloakedImage || !soundEffect) {
      return false;
    }

    const achievement = {
      id,
      title,
      showTitleCloaked,
      description,
      image,
      cloakedImage,
      sound: soundEffect,
    };

    prime_createAchievement(achievement);
    return true;
  }

  /**
   * Edit an achievement
   * @memberof PlayerAchievementsAPI
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {boolean} showTitleCloaked Show the title cloaked?
   * @param {string} description The achievement description
   * @param {string} image The achievement image
   * @param {string} cloakedImage The achievement cloaked image
   * @param {string} soundEffect The achievement sound effect
   * @returns {boolean} Was the achievement edited?
   */
  function editAchievement(id, title, showTitleCloaked, description, image, cloakedImage, soundEffect) {
    if (!id || !title || !description || !image || !cloakedImage || !soundEffect) {
      return false;
    }

    const achievement = {
      id,
      title,
      showTitleCloaked,
      description,
      image,
      cloakedImage,
      sound: soundEffect,
    };

    prime_editAchievement(achievement);
    return true;
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
