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

export const registerSettings = () => {
  game.settings.register("fvtt-player-achievements", "awardedAchievements", {
    "data": {},
    "scope": "world",
    "config": false,
    "default": {},
    "type": Object,
  });

  game.settings.register("fvtt-player-achievements", "pendingAwardedAchievements", {
    "data": {},
    "scope": "world",
    "config": false,
    "default": {},
    "type": Object,
  });

  game.settings.register("fvtt-player-achievements", "customAchievements", {
    "data": [],
    "scope": "world",
    "config": false,
    "default": [],
    "type": Array,
  });

  game.settings.register("fvtt-player-achievements", "lockedAchievements", {
    "data": [],
    "scope": "world",
    "config": false,
    "default": [],
    "type": Array,
  });

  game.settings.register("fvtt-player-achievements", "enablePlayerAchievements", {
    "name": "fvtt-player-achievements.settings.enable-player-achievements.name",
    "hint": "fvtt-player-achievements.settings.enable-player-achievements.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean,
  });

  game.settings.register("fvtt-player-achievements", "hideUnearnedAchievements", {
    "name": "fvtt-player-achievements.settings.hide-unearned.name",
    "hint": "fvtt-player-achievements.settings.hide-unearned.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  game.settings.register("fvtt-player-achievements", "cloakUnearnedAchievements", {
    "name": "fvtt-player-achievements.settings.cloak-unearned.name",
    "hint": "fvtt-player-achievements.settings.cloak-unearned.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean,
  });

  game.settings.register("fvtt-player-achievements", "playSelfSounds", {
    "name": "fvtt-player-achievements.settings.play-self-sounds.name",
    "hint": "fvtt-player-achievements.settings.play-self-sounds.hint",
    "scope": "local",
    "config": true,
    "default": true,
    "type": Boolean,
  });

  game.settings.register("fvtt-player-achievements", "selfSoundVolume", {
    "name": "fvtt-player-achievements.settings.self-sound-volume.name",
    "hint": "fvtt-player-achievements.settings.self-sound-volume.hint",
    "scope": "local",
    "config": true,
    "default": 0.5,
    "type": Number,
    "range": {
      "min": 0,
      "max": 1,
      "step": 0.1,
    },
  });

  game.settings.register("fvtt-player-achievements", "showOnlyToAwardedUser", {
    "name": "fvtt-player-achievements.settings.show-only-to-awarded-user.name",
    "hint": "fvtt-player-achievements.settings.show-only-to-awarded-user.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  game.settings.register("fvtt-player-achievements", "showTagsToPlayers", {
    "name": "fvtt-player-achievements.settings.show-tags-to-players.name",
    "hint": "fvtt-player-achievements.settings.show-tags-to-players.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean,
  });
};
