const PA_API = (function () {
  function getAchievements() {
    return game.settings.get("fvtt-player-achievements", "customAchievements");
  }

  function actorHasAchievement(actor, achievement_id) {
    const achievement = getAchievements().find((a) => a.id === achievement_id);
    if (!achievement) {
      return false;
    }

    return achievement.completedActors.includes(actor.uuid);
  }

  return {
    getAchievements,
    actorHasAchievement,
  };
})();

export default PA_API;
