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
  createAchievement as prime_createAchievement,
  editAchievement as prime_editAchievement,
} from "./core";

/**
 * API Return Payload
 * @interface APIReturnPayload
 * @property {string} message The message
 * @property {boolean} payload The payload
 */

const PA_API = (function () {
  /**
   * Returns the achievements array
   * @returns {Array} Achievements List
   */
  function getAchievements() {
    return game.settings.get("fvtt-player-achievements", "customAchievements");
  }

  /**
   * Does the achievement exist?
   * @param {string} achievement_id The achievement id
   * @returns {boolean} Does the achievement exist?
   */
  function doesAchievementExist(achievement_id) {
    return getAchievements().some((a) => a.id === achievement_id);
  }

  /**
   * Does the actor have the achievement?
   * @param {string} uuid The actor uuid
   * @param {string} achievement_id The achievement id
   * @returns {boolean} Does the actor have the achievement?
   */
  function doesActorHaveAchievement(uuid, achievement_id) {
    const achievement = getAchievements().find((a) => a.id === achievement_id);
    if (!achievement) {
      return false;
    }

    return achievement.completedActors.includes(uuid);
  }

  /**
   * Award the achievement to the actor
   * @param {string} achievement_id The achievement id
   * @param {string} uuid The actor uuid
   * @returns {boolean} success
   */
  async function awardAchievementToActor(achievement_id, uuid) {
    const achievement = getAchievements().find((a) => a.id === achievement_id);
    if (!achievement) {
      return false;
    }

    await prime_awardAchievement(achievement_id, uuid);
  }

  /**
   * Get the achievements for the actor
   * @param {string} uuid The actor uuid
   * @returns {Array} achievements for the actor
   */
  function getAchievementsByActor(uuid) {
    return getAchievements().filter((a) => a.completedActors.includes(uuid));
  }

  /**
   * Create an achievement
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {boolean} showTitleCloaked Show the title cloaked?
   * @param {string} description The achievement description
   * @param {string} image The achievement image
   * @param {string} cloakedImage The achievement cloaked image
   * @param {string} soundEffect The achievement sound effect
   * @returns {APIReturnPayload} API Return Payload
   */
  function createAchievement(id, title, showTitleCloaked, description, image, cloakedImage, soundEffect) {
    if (!id || !title || !description || !image || !cloakedImage || !soundEffect) {
      return { message: "Missing required parameter", payload: false };
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
    return { message: "", payload: true };
  }

  /**
   * Edit an achievement
   * @param {string} id The achievement id
   * @param {string} title The achievement title
   * @param {boolean} showTitleCloaked Show the title cloaked?
   * @param {string} description The achievement description
   * @param {string} image The achievement image
   * @param {string} cloakedImage The achievement cloaked image
   * @param {string} soundEffect The achievement sound effect
   * @returns {APIReturnPayload} API Return Payload
   */
  function editAchievement(id, title, showTitleCloaked, description, image, cloakedImage, soundEffect) {
    if (!id || !title || !description || !image || !cloakedImage || !soundEffect) {
      return { message: "", payload: false };
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
    return { message: "", payload: true };
  }

  return {
    awardAchievementToActor,
    createAchievement,
    editAchievement,
    doesActorHaveAchievement,
    doesAchievementExist,
    getAchievements,
    getAchievementsByActor,
  };
})();

export default PA_API;
