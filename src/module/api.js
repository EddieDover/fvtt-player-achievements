import {
  awardAchievement as prime_awardAchievement,
  createAchievement as prime_createAchievement,
  editAchievement as prime_editAchievement,
} from "./core";

const PA_API = (function () {
  function getAchievements() {
    return game.settings.get("fvtt-player-achievements", "customAchievements");
  }

  function doesAchievementExist(achievement_id) {
    return getAchievements().some((a) => a.id === achievement_id);
  }

  function doesActorHaveAchievement(uuid, achievement_id) {
    const achievement = getAchievements().find((a) => a.id === achievement_id);
    if (!achievement) {
      return false;
    }

    return achievement.completedActors.includes(uuid);
  }

  async function awardAchievementToActor(achievement_id, uuid) {
    const achievement = getAchievements().find((a) => a.id === achievement_id);
    if (!achievement) {
      return false;
    }

    await prime_awardAchievement(achievement_id, uuid);
  }

  function getAchievementsByActor(uuid) {
    return getAchievements().filter((a) => a.completedActors.includes(uuid));
  }

  function createAchievement(id, title, showTitleCloaked, description, image, cloakedImage, soundEffect) {
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

    prime_createAchievement(achievement);
  }

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
