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

import { AddAchievementForm } from "./add-achievement-form";

export class AchievementForm extends FormApplication {
  constructor(overrides) {
    super();
    this.overrides = overrides;
    this.currentFilter = "";
    this.sortza = false;
    this.hideAwarded = false;
    this.hideUnawarded = false;
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
    const currentUsers = game.users.filter((user) => user.active && !user.isGM);

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
      hideAwarded: this.hideAwarded,
      hideUnawarded: this.hideUnawarded,
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
    $('button[name="edit"]', html).click(this.onEditAchievement.bind(this));
    $('button[name="delete"]', html).click(this.onDeleteAchievement.bind(this));
    $('button[class="assign"]', html).click(this.assignAchievement.bind(this));
    $('button[class="unassign"]', html).click(this.unassignAchievement.bind(this));
    $('input[name="hide-awarded"]', html).on("change", this.onToggleHideAwarded.bind(this));
    $('input[name="hide-unawarded"]', html).on("change", this.onToggleHideUnawarded.bind(this));
    $('button[name="filter-azza"]', html).click(this.onSort.bind(this));
    $('select[name="actor-filter"]', html).on("change", this.onSelectPlayer.bind(this));
    $('button[name="import-achievements"]', html).click(await this.onImportAchievements.bind(this));
    $('button[name="export-achievements"]', html).click(this.onExportAchievements.bind(this));
  }

  async onImportAchievements(event) {
    event.preventDefault();
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) {
      ui.notifications.error("No data found in clipboard.");
      return;
    }
    const importedAchievements = JSON.parse(clipboardText);
    if (importedAchievements.length === 0) {
      ui.notifications.error("No achievements found in clipboard.");
      return;
    }

    for (const ach of importedAchievements) {
      if (ach.id === undefined || ach.title === undefined || ach.description === undefined) {
        ui.notifications.error("Invalid achievement format.");
        return;
      }
    }

    const newAwardedAchievements = {};

    for (const ach of importedAchievements) {
      if (ach.completedActors?.length) {
        newAwardedAchievements[ach.id] = ach.completedActors;
        delete ach.completedActors;
      }
    }

    ui.notifications.info(`${importedAchievements.length} Achievements imported from clipboard.`);
    // this.achievements = importedAchievements;
    game.settings.set("fvtt-player-achievements", "customAchievements", importedAchievements);
    game.settings.set("fvtt-player-achievements", "awardedAchievements", newAwardedAchievements);
    this.achievements = await this.filterAchievements();
    console.log(this.achievements);
    setTimeout(() => {
      this.render(true);
    }, 100);
  }

  onExportAchievements(event) {
    event.preventDefault();
    const achievementJSON = JSON.stringify(game.settings.get("fvtt-player-achievements", "customAchievements"));
    navigator.clipboard.writeText(achievementJSON);
    ui.notifications.info("Achievements exported to clipboard.");
  }

  onSelectPlayer(event) {
    event.preventDefault();
    this.seluuid = event.target.value;
    console.log("asdf");
    console.log(this.seluuid);
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

  async assignAchievement(event) {
    event.preventDefault();
    const achievementId = event.target.dataset.achievement_id;
    const playerId = event.target.dataset.player_id;
    const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    const players = awardedAchievements[achievementId] ?? [];
    players.push(playerId);
    awardedAchievements[achievementId] = players;
    game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);
    this.render(true);

    await this.overrides.processAward(achievementId, playerId);
  }

  unassignAchievement(event) {
    event.preventDefault();
    const achievementId = event.target.dataset.achievement_id;
    const playerId = event.target.dataset.player_id;
    const awardedAchievements = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    const players = awardedAchievements[achievementId] ?? [];
    const index = players.indexOf((p) => p === playerId);
    players.splice(index, 1);
    awardedAchievements[achievementId] = players;
    game.settings.set("fvtt-player-achievements", "awardedAchievements", awardedAchievements);
    this.render(true);
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

  onDeleteAchievement(event) {
    const id = event.target.dataset.achievement_id;
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
    const id = event.target.dataset.achievement_id;
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
