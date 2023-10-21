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

export class AddAchievementForm extends FormApplication {
  constructor(overrides) {
    super();
    this.overrides = overrides || {
      mode: "add",
    };
    this.validation = {
      id: "",
    };
  }

  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) {
    this.render(true);
  }

  async getData(options) {
    return mergeObject(super.getData(options), {
      isDM: game.user.isGM,
      overrides: this.overrides,
      validation: this.validation,
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "add-achievement-sheet",
      classes: ["form"],
      title: "Add Achievement",
      submitOnChange: false,
      closeOnSubmit: false,
      template: "modules/fvtt-player-achievements/templates/add-achievement-sheet.hbs",
      width: 400,
      height: "auto",
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (this.overrides.mode === "edit") {
      this.updateSelectImage();
    }

    const achievementId = $("input[name='achievement_id']", html);

    $("button[type='submit']", html).click(this.handleSubmit.bind(this));
    $("button[name='clear']", html).click(this.handleClear.bind(this));
    $("button[name='achievement_image-button']", html).click(this.handleSelectImage.bind(this));
    achievementId.on("keyup", () => this.validateFields());
  }

  validateFields() {
    const achievementId = document.getElementsByName("achievement_id")[0];
    const achievementIdError = document.querySelectorAll(".add-achievement-form__id-error")[0];
    achievementIdError.innerHTML = achievementId.value.includes(" ") ? "ID cannot contain spaces." : "";
  }

  updateSelectImage() {
    const imageInput = document.querySelector("#achievement_image");
    const imagePreview = document.querySelector("#achievement_image_preview");
    imageInput.value = this.overrides.achievement.image;
    imagePreview.style.display = "block";
    imagePreview.src = this.overrides.achievement.image;
  }

  handleSelectImage(event) {
    event.preventDefault();
    // Show the foundry file picker
    const fp = new FilePicker();
    fp.options.type = "image";
    fp.render(true);
    fp.callback = (path, _filePicker) => {
      const imageInput = document.querySelector("#achievement_image");
      imageInput.value = path;
      const imagePreview = document.querySelector("#achievement_image_preview");
      imagePreview.style.display = "block";
      imagePreview.src = path;
    };
  }

  handleImageChange(event) {
    event?.preventDefault();

    const imageInput = document.querySelector("#achievement_image");
    const imagePreview = document.querySelector("#achievement_image_preview");
    // Update the style so it's display:block instead of hidden
    imagePreview.style.display = "block";
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      imagePreview.src = reader.result;
    };
    if (file) {
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = "";
    }
  }

  handleClear(event) {
    event.preventDefault();
    const imageInput = document.querySelector("#achievement_image");
    imageInput.value = "";
    const imagePreview = document.querySelector("#achievement_image_preview");
    imagePreview.src = "modules/fvtt-player-achievements/images/default.webp";
  }

  handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target.form);
    // eslint-disable-next-line unicorn/no-array-reduce
    const data = [...formData.entries()].reduce((accumulator, [key, value]) => {
      accumulator[key] = value;
      return accumulator;
    }, {});

    // Verify none of the fields are blank
    if (Object.values(data).some((value) => !value)) {
      ui.notifications.error("Please fill out all fields.");
      return;
    }

    const achievement = {
      id: data.achievement_id,
      title: data.achievement_title,
      description: data.achievement_description,
      image: data.achievement_image,
    };

    const customAchievements = game.settings.get("fvtt-player-achievements", "customAchievements");

    const editing = this.overrides.mode === "edit";

    if (editing) {
      achievement.id = this.overrides.achievement.id;
      const index = customAchievements.findIndex((a) => a.id === achievement.id);
      customAchievements[index] = achievement;
      game.settings.set("fvtt-player-achievements", "customAchievements", customAchievements);
      ui.notifications.info("Achievement updated.");
    } else {
      // Verify the achievement doesn't already exist
      if (customAchievements.some((a) => a.id === achievement.id)) {
        ui.notifications.error("An achievement with that ID already exists.");
        return;
      }
      customAchievements.push(achievement);
      game.settings.set("fvtt-player-achievements", "customAchievements", customAchievements);
      ui.notifications.info("Achievement added.");
    }
    const onendfunc = this.overrides?.onend;
    if (onendfunc) {
      onendfunc();
    }
    super.close();
  }
}
