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

const { DialogV2, ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import { generateUniqueId } from "../core";
import { localize } from "../utils";

export class AchievementsImportDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "achievements-import-dialog",
    classes: ["form"],
    title: "Achievements Import",
    window: {
      width: 500,
      zIndex: 1000,
      height: 500,
      maxHeight: 500,
    },
    actions: {
      onImport: AchievementsImportDialog.onImportAchievements,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-player-achievements/templates/achievements-import-dialog.hbs",
    },
  };

  constructor(overrides) {
    super();
    this.overrides = overrides;
    this.onFinished = overrides.onFinished;
  }

  closeWindow() {
    this.close();
  }

  static async onImportAchievements() {
    const achievementsText = document.querySelector('textarea[name="fpa-import-data"]').value;

    if (!achievementsText) {
      ui.notifications.error(localize("fvtt-player-achievements.messages.no-clipboard-data"));
      return;
    }
    const destructiveyesno = await DialogV2.confirm({
      title: localize("fvtt-player-achievements.messages.import-achievements.title"),
      content: localize("fvtt-player-achievements.messages.import-achievements.content"),
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

    const importedAchievements = JSON.parse(achievementsText);
    if (importedAchievements.length === 0) {
      ui.notifications.error(localize("fvtt-player-achievements.messages.no-achievements-in-clipboard"));
      return;
    }

    for (const ach of importedAchievements) {
      if (ach.title === "" || ach.title === undefined || ach.description === "" || ach.description === undefined) {
        ui.notifications.error(localize("fvtt-player-achievements.message.invalid-achievement-format"));
        return;
      }
      if (ach.id === "" || ach.id === undefined) {
        ach.id = await generateUniqueId();
      }
    }

    const newAwardedAchievements = {};

    for (const ach of importedAchievements) {
      if (ach.completedActors?.length) {
        newAwardedAchievements[ach.id] = ach.completedActors;
        delete ach.completedActors;
      }
    }

    ui.notifications.info(
      `${importedAchievements.length} ${localize("fvtt-player-achievements.messages.achievements-imported")}`,
    );
    game.settings.set("fvtt-player-achievements", "customAchievements", importedAchievements);
    game.settings.set("fvtt-player-achievements", "awardedAchievements", newAwardedAchievements);
    this.onFinished();
    this.closeWindow();
  }
}
