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

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import { DEFAULT_IMAGE } from "../constants";
import { getDefaultSound, localize } from "../utils";
import { createAchievement, editAchievement, generateUniqueId } from "../core";

export class AddAchievementForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      title: "fvtt-player-achievements.forms.add-achievement-form.window-title",
      width: 400,
      height: "auto",
    },
    actions: {
      onSubmit: AddAchievementForm.handleSubmit,
      onClearImage: AddAchievementForm.handleClearImage,
      onClearCloakedImage: AddAchievementForm.handleClearCloakedImage,
      onPreviewSound: AddAchievementForm.handlePreviewSound,
      onClearSound: AddAchievementForm.handleClearSound,
      onSelectImage: AddAchievementForm.handleSelectImage,
      onSelectCloakedImage: AddAchievementForm.handleSelectCloakedImage,
      onSelectSound: AddAchievementForm.handleSelectSound,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-player-achievements/templates/add-achievement-sheet.hbs",
    },
  };

  constructor(overrides) {
    super();
    this.workingTags = "";
    this.overrides = overrides || {
      mode: "add",
    };
    this.validation = {
      id: "",
    };
  }

  async _onRender(html) {
    if (this.overrides.mode === "edit") {
      this.updateSelectImage();
      this.updateSelectCloakedImage();
      this.updateSelectSound();
    } else {
      await this.setupDefaults();
    }

    const achievementId = $("input[name='achievement_id']", html);
    achievementId.on("keyup", () => this.validateFields());
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(event, formData) {
    this.render(true);
  }

  _prepareContext(_options, _b, _c) {
    let tagarr = this.overrides.achievement?.tags ? structuredClone(this.overrides.achievement.tags) : [];
    if (typeof tagarr === "string") {
      tagarr = tagarr.split(",");
    }
    this.workingTags = tagarr?.join(", ") ?? "";
    return {
      isDM: game.user.isGM,
      overrides: this.overrides,
      validation: this.validation,
      workingTags: this.workingTags,
    };
  }

  async setupDefaults() {
    console.log("SETUP DEFAULTS");
    const imageInput = document.querySelector("#achievement_image");
    const imagePreview = document.querySelector("#achievement_image_preview");
    const achievementId = document.querySelectorAll("[name='achievement_id']")[0];

    achievementId.value = await generateUniqueId();
    imageInput.value = DEFAULT_IMAGE;
    imagePreview.style.display = "block";
    imagePreview.src = DEFAULT_IMAGE;

    const cloakedImageInput = document.querySelector("#achievement_cloaked_image");
    const cloakedImagePreview = document.querySelector("#achievement_cloaked_image_preview");
    cloakedImageInput.value = DEFAULT_IMAGE;
    cloakedImagePreview.style.display = "block";
    cloakedImagePreview.src = DEFAULT_IMAGE;

    const soundInput = document.querySelector("#achievement_sound");
    const soundPreview = document.querySelector("#achievement_sound_preview");
    soundInput.value = getDefaultSound();
    soundPreview.style.display = "none";
    soundPreview.src = getDefaultSound();
  }

  validateFields() {
    const achievementId = document.querySelectorAll("[name='achievement_id']")[0];
    const achievementIdError = document.querySelectorAll(".add-achievement-form__id-error")[0];
    achievementIdError.innerHTML = achievementId.value.includes(" ")
      ? localize("fvtt-player-achievements.messages.id-no-spaces")
      : "";
  }

  static handlePreviewSound(event) {
    event.preventDefault();
    const soundPreview = document.querySelector("#achievement_sound_preview");
    if (soundPreview.src === globalThis.location.href) {
      new Audio(getDefaultSound()).play();
    } else {
      soundPreview.play();
    }
  }

  static handleClearSound(event) {
    event.preventDefault();
    const soundInput = document.querySelector("#achievement_sound");
    soundInput.value = getDefaultSound();
    const soundPreview = document.querySelector("#achievement_sound_preview");
    soundPreview.src = getDefaultSound();
  }

  updateSelectSound() {
    const soundInput = document.querySelector("#achievement_sound");
    const soundPreview = document.querySelector("#achievement_sound_preview");
    soundInput.value = this.overrides.achievement.sound ?? "";
    soundPreview.style.display = "block";
    soundPreview.src = this.overrides.achievement.sound ?? "";
  }

  updateSelectImage() {
    const imageInput = document.querySelector("#achievement_image");
    const imagePreview = document.querySelector("#achievement_image_preview");
    imageInput.value = this.overrides.achievement.image;
    imagePreview.style.display = "block";
    imagePreview.src = this.overrides.achievement.image;
  }

  updateSelectCloakedImage() {
    const imageInput = document.querySelector("#achievement_cloaked_image");
    const imagePreview = document.querySelector("#achievement_cloaked_image_preview");
    imageInput.value = this.overrides.achievement.cloakedImage ?? this.overrides.achievement.image;
    imagePreview.style.display = "block";
    imagePreview.src = this.overrides.achievement.cloakedImage ?? this.overrides.achievement.image;
  }

  static handleSelectSound(event) {
    event.preventDefault();
    // Show the foundry file picker
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "audio",
      callback: (path, _filePicker) => {
        const soundInput = document.querySelector("#achievement_sound");
        soundInput.value = path;
        const soundPreview = document.querySelector("#achievement_sound_preview");
        soundPreview.style.display = "block";
        soundPreview.src = path;
      },
    });

    fp.render(true);
  }

  static handleSelectImage(event) {
    event.preventDefault();

    // Show the foundry file picker
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      callback: (path, _filePicker) => {
        const imageInput = document.querySelector("#achievement_image");
        imageInput.value = path;
        const imagePreview = document.querySelector("#achievement_image_preview");
        imagePreview.style.display = "block";
        imagePreview.src = path;
      },
    });
    fp.render(true);
  }

  static handleSelectCloakedImage(event) {
    event.preventDefault();

    // Show the foundry file picker
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      callback: (path, _filePicker) => {
        const imageInput = document.querySelector("#achievement_cloaked_image");
        imageInput.value = path;
        const imagePreview = document.querySelector("#achievement_cloaked_image_preview");
        imagePreview.style.display = "block";
        imagePreview.src = path;
      },
    });

    fp.render(true);
  }

  static handleImageChange(event) {
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

  static handleCloakedImageChange(event) {
    event?.preventDefault();

    const imageInput = document.querySelector("#achievement_cloaked_image");
    const imagePreview = document.querySelector("#achievement_cloaked_image_preview");
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

  static handleClearImage(event) {
    event.preventDefault();
    const imageInput = document.querySelector("#achievement_image");
    imageInput.value = "modules/fvtt-player-achievements/images/default.webp";
    const imagePreview = document.querySelector("#achievement_image_preview");
    imagePreview.src = "modules/fvtt-player-achievements/images/default.webp";
  }

  static handleClearCloakedImage(event) {
    event.preventDefault();
    const uncloakedImageInput = document.querySelector("#achievement_image");
    const unlcoakedImagePreview = document.querySelector("#achievement_image_preview");
    const imageInput = document.querySelector("#achievement_cloaked_image");
    imageInput.value = uncloakedImageInput.value;
    const imagePreview = document.querySelector("#achievement_cloaked_image_preview");
    imagePreview.src = unlcoakedImagePreview.src;
  }

  static async handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target.form);
    // eslint-disable-next-line unicorn/no-array-reduce
    const data = [...formData.entries()].reduce((accumulator, [key, value]) => {
      if (["achievement_title_hiddenoption"].includes(key)) {
        accumulator[key] = true;
        return accumulator;
      } else {
        accumulator[key] = value;
        return accumulator;
      }
    }, {});

    if (!data.achievement_sound) {
      data.achievement_sound = getDefaultSound();
    }

    // eslint-disable-next-line unicorn/no-array-reduce
    const data_no_tags = Object.keys(data).reduce((object, key) => {
      if (key !== "achievement_tags") {
        object[key] = data[key];
      }
      return object;
    }, {});

    // Verify none of the fields are blank
    if (Object.values(data_no_tags).some((value) => !value)) {
      ui.notifications.error(localize("fvtt-player-achievements.messages.missing-fields"));
      return;
    }

    const tag_array = data.achievement_tags
      .trim()
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const achievement = {
      id: data.achievement_id,
      title: data.achievement_title,
      showTitleCloaked: !!data.achievement_title_hiddenoption,
      description: data.achievement_description,
      image: data.achievement_image,
      cloakedImage: data.achievement_cloaked_image,
      sound: data.achievement_sound,
      tags: tag_array,
    };

    const editing = this.overrides.mode === "edit";

    const customAchievements = await game.settings.get("fvtt-player-achievements", "customAchievements");

    if (editing) {
      achievement.id = this.overrides.achievement.id;
      if (!achievement.id || !achievement.title) {
        return;
      }
      editAchievement(achievement);
      ui.notifications.info(localize("fvtt-player-achievements.messages.achievement-updated"));
    } else {
      if (!achievement.id || !achievement.title) {
        return;
      }
      // Verify the achievement doesn't already exist
      if (customAchievements.some((a) => a.id === achievement.id)) {
        ui.notifications.error(localize("fvtt-player-achievements.messages.duplicate-id"));
        return;
      }
      createAchievement(achievement);
      ui.notifications.info(localize("fvtt-player-achievements.messages.achievement-added"));
    }
    const onendfunc = this.overrides?.onend;
    if (onendfunc) {
      onendfunc();
    }
    this.close();
  }
}
