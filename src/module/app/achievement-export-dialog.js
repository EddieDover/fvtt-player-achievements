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

export class AchievementsExportDialog extends Application {
  constructor(overrides) {
    super();
    this.overrides = overrides;
    this.exportData = JSON.stringify(game.settings.get("fvtt-player-achievements", "customAchievements")).trim();
  }

  async getData(options) {
    return mergeObject(super.getData(options), {
      exportData: this.exportData,
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "achievements-export-dialog",
      classes: ["form"],
      title: "Achievements Export",
      template: "modules/fvtt-player-achievements/templates/achievements-export-dialog.hbs",
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
  }
}
