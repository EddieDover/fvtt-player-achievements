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

import { localize } from "../utils";

export class AchievementsImportDialog extends Application {
  constructor(overrides) {
    super();
    this.overrides = overrides;
    this.onFinished = overrides.onFinished;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "achievements-import-dialog",
      classes: ["form"],
      title: "Achievements Import",
      template: "modules/fvtt-player-achievements/templates/achievements-import-dialog.hbs",
      width: 500,
      zIndex: 1000,
      height: 500,
      maxHeight: 500,
    });
  }

  closeWindow() {
    this.close();
  }

  async activateListeners(html) {
    super.activateListeners(html);

    $('button[name="fpa-import"]', html).click(this.onImportAchievements.bind(this));
  }

  async onImportAchievements() {
    const achievementsText = $('textarea[name="fpa-import-data"]').val();

    if (!achievementsText) {
      ui.notifications.error(localize("fvtt-player-achievements.messages.no-clipboard-data"));
      return;
    }
    const destructiveyesno = await Dialog.confirm({
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
      if (ach.id === undefined || ach.title === undefined || ach.description === undefined) {
        ui.notifications.error(localize("fvtt-player-achievements.message.invalid-achievement-format"));
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

    ui.notifications.info(
      `${importedAchievements.length} ${localize("fvtt-player-achievements.messages.achievements-imported")}`,
    );
    // this.achievements = importedAchievements;
    game.settings.set("fvtt-player-achievements", "customAchievements", importedAchievements);
    game.settings.set("fvtt-player-achievements", "awardedAchievements", newAwardedAchievements);
    this.onFinished();
    this.closeWindow();
  }
}
