export const MODULE_NAME = "fvtt-player-achievements";
import { deepCopy, hydrateAwardedAchievements } from "./utils.js";
var achievement_socket;

export function log(...message) {
  console.log(`${MODULE_NAME} |`, message);
}

export function setupAchievementSocket() {
  achievement_socket = socketlib.registerModule("fvtt-player-achievements");
  achievement_socket.register("getAchievements", getAchivements);
  achievement_socket.register("awardAchievement", (data) => {
    awardAchievement(data.achievementId, data.playerId);
  });
  achievement_socket.register("awardAchievementSelf", awardAchievementSelf);
}

export function createAchievement({ id, title, showTitleCloaked, description, image, cloakedImage, soundEffect }) {
  const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements");
  customAchievements.push({ id, title, showTitleCloaked, description, image, cloakedImage, soundEffect });
  game.settings.set("fvtt-player-achievements", "customAchievements", customAchievements);
}

export function editAchievement({ id, title, showTitleCloaked, description, image, cloakedImage, soundEffect }) {
  const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements");
  const index = customAchievements.findIndex((a) => a.id === id);
  if (index === -1) {
    return;
  }
  customAchievements[index] = { id, title, showTitleCloaked, description, image, cloakedImage, soundEffect };
  game.settings.set("fvtt-player-achievements", "customAchievements", customAchievements);
}

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

export async function awardAchievement(achievementId, playerId) {
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

export async function awardAchievementSelf({ achievement, playerId }) {
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
