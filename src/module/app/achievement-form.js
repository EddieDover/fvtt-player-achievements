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

import { AchievementsExportDialog } from "./achievement-export-dialog";
import { AchievementsImportDialog } from "./achievement-import-dialog";
import { AddAchievementForm } from "./add-achievement-form";
import { hydrateAwardedAchievements, localize } from "../utils";

const FEEDBACK_URL = "https://github.com/eddiedover/fvtt-player-achievements/issues/new?template=feature_request.md";
const BUGREPORT_URL = "https://github.com/eddiedover/fvtt-player-achievements/issues/new?template=bug_report.md";
const DISCORD_URL = "https://discord.gg/XuGx7zNMKZ";

let achievementsExportDialog;
let achievementsImportDialog;

export class AchievementForm extends FormApplication {
  constructor(overrides) {
    super();
    this.overrides = overrides;
    this.currentFilter = "";
    this.sortza = false;
    this.hideAwarded = false;
    this.hideUnawarded = false;
    this.hideDetails = false;
    this.seluuid = "";
  }

  async _updateObject(_event, _formData) {
    this.render(true);
  }

  async filterAchievements() {
    const achievements = await this.overrides.updateAchievements();
    const filtered = achievements.filter((achi) => {
      if (this.currentFilter) {
        return achi.title.toLowerCase().includes(this.currentFilter.toLowerCase());
      }
      return true;
    });
    return filtered;
  }

  async getData(options) {
    const currentUsers = game.users.filter((user) => /*user.active &&*/ !user.isGM);

    const players = currentUsers.map((user) => user.character);
    if (!players) return;

    let achievements = await this.filterAchievements();

    if (this.sortza) {
      achievements = achievements.sort((a, b) => {
        if (a.title < b.title) return -1;
        if (a.title > b.title) return 1;
        return 0;
      });
    }
    const myUUID = game.user.character?.uuid;

    if (this.hideAwarded && myUUID) {
      achievements = achievements.filter((achievement) => {
        return !achievement.completedActors.includes(myUUID);
      });
    }

    if (this.hideUnawarded && myUUID) {
      achievements = achievements.filter((achievement) => {
        return achievement.completedActors.includes(myUUID);
      });
    }

    if (this.seluuid) {
      achievements = achievements.filter((achievement) => {
        return achievement.completedActors.includes(this.seluuid);
      });
    }

    return mergeObject(super.getData(options), {
      isDM: game.user.isGM,
      myuuid: game.user.character?.uuid,
      achievements: achievements,
      currentFilter: this.currentFilter,
      sortza: this.sortza,
      hideDetails: this.hideDetails,
      hideAwarded: this.hideAwarded,
      hideUnawarded: this.hideUnawarded,
      lockedAchievements: game.settings.get("fvtt-player-achievements", "lockedAchievements") ?? [],
      seluuid: this.seluuid,
      currentPlayers: players?.map((player) => {
        return {
          name: player?.name,
          uuid: player?.uuid,
        };
      }),
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "achievements-sheet",
      classes: ["form"],
      title: "Achievements",
      submitOnChange: true,
      closeOnSubmit: false,
      template: "modules/fvtt-player-achievements/templates/achievements-sheet.hbs",
      width: 500,
      height: "auto",
      maxHeight: 500,
    });
  }

  closeWindow() {
    this.close();
  }

  async activateListeners(html) {
    super.activateListeners(html);

    const inputElement = $('input[name="achievement_filter"]', html);
    inputElement.keyup(this.onFilterChange.bind(this));
    inputElement.ready(this.onInputLoad.bind(this));
    $('button[name="add-achievement"]', html).click(this.onAddAchievement.bind(this));
    $(".edit-button", html).click(this.onEditAchievement.bind(this));
    $(".delete-button", html).click(this.onDeleteAchievement.bind(this));
    $(".toggle-lock", html).click(this.onToggleLock.bind(this));
    $('button[class="assign"]', html).click(this.assignAchievement.bind(this));
    $('button[class="unassign"]', html).click(this.unassignAchievement.bind(this));
    $('input[name="hide-awarded"]', html).on("change", this.onToggleHideAwarded.bind(this));
    $('input[name="hide-unawarded"]', html).on("change", this.onToggleHideUnawarded.bind(this));
    $('input[name="hide-details"]', html).on("change", this.onToggleHideDetails.bind(this));
    $('button[name="filter-azza"]', html).click(this.onSort.bind(this));
    $('select[name="actor-filter"]', html).on("change", this.onSelectPlayer.bind(this));
    $('button[name="import-achievements"]', html).click(await this.onImportAchievements.bind(this));
    $('button[name="export-achievements"]', html).click(this.onExportAchievements.bind(this));

    $('button[name="feedback"]', html).click(this.onFeedback.bind(this));
    $('button[name="bugreport"]', html).click(this.onBugReport.bind(this));
    $('button[name="discord"]', html).click(this.onDiscord.bind(this));
  }

  async onFeedback(event) {
    event.preventDefault();
    const newWindow = window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  async onBugReport(event) {
    event.preventDefault();
    const newWindow = window.open(BUGREPORT_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  async onDiscord(event) {
    event.preventDefault();
    const newWindow = window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  async toggleImportDialog() {
    if (achievementsImportDialog?.rendered) {
      achievementsImportDialog.close();
    } else {
      achievementsImportDialog = new AchievementsImportDialog({ onFinished: this.onFinishedImport.bind(this) });
      achievementsImportDialog.render(true);
    }
  }

  async onImportAchievements(event) {
    event.preventDefault();
    this.toggleImportDialog();
  }

  async onFinishedImport() {
    this.achievements = await this.filterAchievements();
    setTimeout(() => {
      this.render(true);
    }, 100);
  }

  onExportAchievements(event) {
    event.preventDefault();

    if (achievementsExportDialog?.rendered) {
      achievementsExportDialog.close();
    } else {
      achievementsExportDialog = new AchievementsExportDialog();
      achievementsExportDialog.render(true);
    }
  }

  onSelectPlayer(event) {
    event.preventDefault();
    this.seluuid = event.target.value;
    this.render(true);
  }

  onSort(event) {
    event.preventDefault();
    this.sortza = !this.sortza;
    this.render(true);
  }

  onToggleHideAwarded(event) {
    event.preventDefault();
    this.hideAwarded = event.target.checked;
  }

  onToggleHideUnawarded(event) {
    event.preventDefault();
    this.hideUnawarded = event.target.checked;
  }

  onToggleHideDetails(event) {
    event.preventDefault();
    this.hideDetails = event.target.checked;
  }

  lockAchievement(achievementId) {
    const lockedAchievements = game.settings.get("fvtt-player-achievements", "lockedAchievements") ?? [];
    const index = lockedAchievements.indexOf(achievementId);
    if (index === -1) {
      lockedAchievements.push(achievementId);
    } else {
      lockedAchievements.splice(index, 1);
    }
    game.settings.set("fvtt-player-achievements", "lockedAchievements", lockedAchievements);
  }

  unlockAchievement(achievementId) {
    const lockedAchievements = game.settings.get("fvtt-player-achievements", "lockedAchievements") ?? [];
    const index = lockedAchievements.indexOf(achievementId);
    if (index !== -1) {
      lockedAchievements.splice(index, 1);
    }
    game.settings.set("fvtt-player-achievements", "lockedAchievements", lockedAchievements);
  }

  onToggleLock(event) {
    event.preventDefault();
    event.stopPropagation();
    const achievementId = event.currentTarget.dataset.achievement_id;
    if (!achievementId) return;
    const isLockedAchievement = game.settings
      .get("fvtt-player-achievements", "lockedAchievements")
      ?.includes(achievementId);
    if (isLockedAchievement) {
      this.unlockAchievement(achievementId);
    } else {
      this.lockAchievement(achievementId);
    }
    this.render(true);
  }

  async awardAchievement(achievementId, playerId) {
    const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    var players = [...awardedAchievements[achievementId]] ?? [];
    players.push(playerId);
    players = [...new Set(players)];
    awardedAchievements[achievementId] = players;
    game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);
    await this.overrides.processAward(achievementId, playerId);
  }

  unawardAchievement(achievementId, playerId) {
    const awardedAchievements = { ...game.settings.get("fvtt-player-achievements", "awardedAchievements") };
    const awardedPlayers = [...awardedAchievements[achievementId]] ?? [];

    if (Array.isArray(playerId)) {
      for (const player of playerId) {
        for (const [index, awardedPlayer] of awardedPlayers.entries()) {
          if (awardedPlayer === player) {
            awardedPlayers.splice(index, 1);
          }
        }
      }
    } else {
      for (const [index, player] of awardedPlayers.entries()) {
        if (player === playerId) {
          awardedPlayers.splice(index, 1);
        }
      }
    }
    //const index = awardedPlayers.indexOf((p) => p === playerId);
    awardedAchievements[achievementId] = awardedPlayers;
    game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);

    const hydratedAchievements = hydrateAwardedAchievements(awardedAchievements);
    game.settings.set("fvtt-player-achievements", "customAchievements", hydratedAchievements);
  }

  async assignAchievement(event) {
    event.preventDefault();
    const achievementId = event.currentTarget.dataset.achievement_id;
    const playerId = event.currentTarget.dataset.player_id;
    // get the player name for debug purposes
    const playerName = game.users.find((user) => user.character?.uuid === playerId)?.character?.name;
    if (playerId === "ALL") {
      const currentUsers = game.users.filter((user) => /*user.active &&*/ !user.isGM);
      //Filter out the users who already have the achievement
      const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");
      const players = awardedAchievements[achievementId] ?? [];
      const filteredUsers = currentUsers.filter((user) => {
        return !players.includes(user.character?.uuid);
      });
      for (const user of filteredUsers) {
        await this.awardAchievement(achievementId, user.character?.uuid);
      }
    } else {
      await this.awardAchievement(achievementId, playerId);
    }

    this.render(true);
  }

  unassignAchievement(event) {
    event.preventDefault();
    const achievementId = event.currentTarget.dataset.achievement_id;
    const playerId = event.currentTarget.dataset.player_id;
    // get the player name for debug purposes
    if (playerId === "ALL") {
      // const currentUsers = game.users.filter((user) => /*user.active &&*/ !user.isGM);
      // for (const user of currentUsers) {
      //   this.unawardAchievement(achievementId, user.character?.uuid);
      // }
      const currentUserUUIDs = game.users
        .filter((user) => /*user.active &&*/ !user.isGM)
        .map((user) => user.character?.uuid);
      this.unawardAchievement(achievementId, currentUserUUIDs);
    } else {
      this.unawardAchievement(achievementId, playerId);
    }

    setTimeout(() => {
      this.render(true);
    }, 100);
  }

  onAddAchievement(_event) {
    const overrides = {
      onend: () => {
        setTimeout(() => {
          this.render(true);
        }, 350);
      },
    };
    const addAchievementForm = new AddAchievementForm(overrides);
    addAchievementForm.render(true);
  }

  async onDeleteAchievement(event) {
    const destructiveyesno = await Dialog.confirm({
      title: localize("fvtt-player-achievements.messages.delete-achievement.title"),
      content: localize("fvtt-player-achievements.messages.delete-achievement.content"),
      yes: () => {
        return true;
      },
      no: () => {
        return false;
      },
    });

    if (!destructiveyesno) {
      return;
    }

    const id = event.currentTarget.dataset.achievement_id;
    this.unlockAchievement(id);
    const achievements = game.settings.get("fvtt-player-achievements", "customAchievements");
    const index = achievements.findIndex((a) => a.id === id);
    achievements.splice(index, 1);
    game.settings.set("fvtt-player-achievements", "customAchievements", achievements);

    const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");

    for (const [achievementId, _players] of Object.entries(awardedAchievements)) {
      if (achievementId === id) {
        delete awardedAchievements[achievementId];
      }
    }
    game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);

    this.render(true);
  }

  onEditAchievement(event) {
    const id = event.currentTarget.dataset.achievement_id;
    const overrides = {
      onend: () => {
        setTimeout(() => {
          this.render(true);
        }, 350);
      },
      mode: "edit",
      achievement: game.settings.get("fvtt-player-achievements", "customAchievements").find((a) => a.id === id),
    };
    const addAchievementForm = new AddAchievementForm(overrides);
    addAchievementForm.render(true);
  }

  onInputLoad(_event) {
    const inputElement = $('input[name="achievement_filter"]')[0];

    if (inputElement) {
      inputElement.setSelectionRange(this.currentFilter.length, this.currentFilter.length);
    }
  }

  onFilterChange(event) {
    event.preventDefault();
    const key = event.key;
    this.currentFilter = event.target.value.toLowerCase();
    if (key == "Enter") {
      this.render(true);
    }
  }
}
