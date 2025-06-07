import { AchievementsExportDialog } from "./achievement-export-dialog";
import { AchievementsImportDialog } from "./achievement-import-dialog";
import { AddAchievementForm } from "./add-achievement-form";
import { localize } from "../utils";
import { awardAchievement, deleteAchievement, unAwardAchievement } from "../core";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const FEEDBACK_URL = "https://github.com/eddiedover/fvtt-player-achievements/issues/new?template=feature_request.md";
const BUGREPORT_URL = "https://github.com/eddiedover/fvtt-player-achievements/issues/new?template=bug_report.md";
const DISCORD_URL = "https://discord.gg/XNRxNsWy2p";

export class AchievementFormV13 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: AchievementFormV13.formHandler,
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      title: "Achievement Form",
      width: 400,
      height: "auto",
    },
    actions: {
      onFilterChange: AchievementFormV13.onFilterChange, //done
      onInputLoad: AchievementFormV13.onInputLoad, // done
      onAddAchievement: AchievementFormV13.onAddAchievement, // done
      onEditAchievement: AchievementFormV13.onEditAchievement, // done
      onDeleteAchievement: AchievementFormV13.onDeleteAchievement, // done
      onToggleLock: AchievementFormV13.onToggleLock, // done
      assignAchievement: AchievementFormV13.assignAchievement, // done
      unassignAchievement: AchievementFormV13.unassignAchievement, // done
      toggleTagFilter: AchievementFormV13.toggleTagFilter, // done
      onToggleHideAwarded: AchievementFormV13.onToggleHideAwarded, //done
      onToggleHideUnawarded: AchievementFormV13.onToggleHideUnawarded, // done
      onToggleHideDetails: AchievementFormV13.onToggleHideDetails, // done
      onToggleOnlyOnline: AchievementFormV13.onToggleOnlyOnline, // done
      onSort: AchievementFormV13.onSort, // done
      onSelectCharacter: AchievementFormV13.onSelectCharacter, // needs custom
      onImportAchievements: AchievementFormV13.onImportAchievements, // done
      onExportAchievements: AchievementFormV13.onExportAchievements, // done
      onCopyIdToClipboard: AchievementFormV13.onCopyIdToClipboard,
      onFeedback: AchievementFormV13.onFeedback, // done
      onBugReport: AchievementFormV13.onBugReport, // done
      onDiscord: AchievementFormV13.onDiscord, // done
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-player-achievements/templates/achievements-sheet.hbs",
    },
  };

  constructor(overrides) {
    super();
    this.overrides = overrides || {};
    this.currentFilter = "";
    this.currentTagFilter = [];
    this.sortza = false;
    this.hideAwarded = false;
    this.hideUnawarded = false;
    this.hideDetails = false;
    this.onlyOnline = false;
    this.seluuid = "";
    this.achievementsImportDialog = null;
    this.achievementsExportDialog = null;
  }

  async _prepareContext(options, b, c) {
    console.log("prepareContext", options, b, c);
    const currentUsers = game.users.filter((user) => user.character != undefined && !user.isGM);

    const characters = currentUsers.map((user) => user.character);
    if (!characters) return;

    let achievements = await this.filterAchievements();

    achievements.sort((a, b) => {
      const comparison = a.title?.localeCompare(b.title); // Compare titles (string comparison)
      return this.sortza ? -comparison : comparison; // Sort based on sortasc, negative for descending
    });

    const myCharacterUUID = game.user.character?.uuid;

    if (this.hideAwarded && myCharacterUUID) {
      achievements = achievements.filter((achievement) => {
        return !achievement.completedActors.includes(myCharacterUUID);
      });
    }

    if (this.hideUnawarded && myCharacterUUID) {
      achievements = achievements.filter((achievement) => {
        return achievement.completedActors.includes(myCharacterUUID);
      });
    }

    if (this.seluuid) {
      if (this.seluuid === "online") {
        achievements = achievements.filter((achievement) => {
          return currentUsers
            .filter((user) => user.active)
            .some((user) => achievement.completedActors.includes(user.character?.uuid));
        });
      } else {
        if (this.seluuid.startsWith("User.")) {
          const uuid = this.seluuid.replace("User.", "");
          const playerActors = game.actors.filter(
            (actor) => Object.keys(actor.ownership).includes(uuid) && actor.ownership[uuid] === 3,
          );
          achievements = achievements.filter((achievement) => {
            return playerActors.some((actor) => achievement.completedActors.includes(actor.uuid));
          });
        } else {
          achievements = achievements.filter((achievement) => {
            return achievement.completedActors.includes(this.seluuid);
          });
        }
      }
    }

    let filteredCharacters = characters?.map((character) => {
      return {
        name: character?.name,
        uuid: character?.uuid,
      };
    });

    if (this.onlyOnline) {
      filteredCharacters = filteredCharacters.filter((character) => {
        return currentUsers.some((user) => user.character?.uuid === character.uuid && user.active);
      });
    }

    const payload = {
      isDM: game.user.isGM,
      myuuid: game.user.character?.uuid,
      achievements: achievements,
      currentFilter: this.currentFilter,
      currentTagFilter: this.currentTagFilter,
      sortza: this.sortza,
      hideDetails: this.hideDetails,
      onlyOnline: this.onlyOnline,
      hideAwarded: this.hideAwarded,
      hideUnawarded: this.hideUnawarded,
      lockedAchievements: (await game.settings.get("fvtt-player-achievements", "lockedAchievements")) ?? [],
      seluuid: this.seluuid,
      currentCharacters: filteredCharacters,
      currentUsers: game.users
        .filter((user) => !user.isGM)
        .map((user) => {
          return {
            name: user.name,
            uuid: user.uuid,
          };
        }),
    };
    return payload;
    //return foundry.utils.mergeObject(super._prepareContext(options), payload);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const achievementFilterInput = document.querySelector(".achievements-sheet__filter");
    const achievementFilterButton = document.querySelector("#achievements-sheet__filter_button");
    // Make the Enter key do nothing
    achievementFilterInput.addEventListener("keydown", (event) => {
      console.log(event.key);
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        this.currentFilter = event.target.value.trim().toLowerCase();
        achievementFilterButton.click();
      }
    });
    achievementFilterInput.setSelectionRange(this.currentFilter.length, this.currentFilter.length);
  }

  static async formHandler(event, form, formData) {
    event.preventDefault();
    event.stopPropagation();

    // Handle form submission logic here
    // For example, you can process the formData and update the application state
    console.log("Form submitted with data:", formData);

    // Optionally, you can close the form after submission
    // this.close();
  }

  async filterAchievements() {
    const achievements = await this.overrides.updateAchievements();
    const filtered = achievements.filter((achi) => {
      if (this.currentFilter) {
        return achi.title.toLowerCase().includes(this.currentFilter.toLowerCase());
      }
      return true;
    });
    if (this.currentTagFilter.length > 0) {
      return filtered.filter((achi) => {
        return this.currentTagFilter.every((tag) => achi.tags?.includes(tag));
      });
    }
    return filtered;
  }

  static onFilterChange(event) {
    event.preventDefault();
    event.stopPropagation();

    const achievementFilterInput = document.querySelector("#achievement_filter_input");

    this.currentFilter = achievementFilterInput.value.trim().toLowerCase();
    this.render(true);
  }

  static onAddAchievement(_event) {
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

  static async onEditAchievement(event) {
    const id = event.currentTarget.dataset.achievement_id;
    const overrides = {
      onend: () => {
        setTimeout(() => {
          this.render(true);
        }, 350);
      },
      mode: "edit",
      achievement: await game.settings.get("fvtt-player-achievements", "customAchievements").find((a) => a.id === id),
    };
    const addAchievementForm = new AddAchievementForm(overrides);
    addAchievementForm.render(true);
  }

  static async onDeleteAchievement(event) {
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
    deleteAchievement(id);
    this.render(true);
  }

  static onToggleLock(event) {
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

  static async assignAchievement(event) {
    event.preventDefault();
    const achievementId = event.currentTarget.dataset.achievement_id;
    const characterId = event.currentTarget.dataset.character_id;
    // get the player name for debug purposes
    if (characterId === "ALL") {
      const currentUsers = game.users.filter((user) => !user.isGM);
      //Filter out the users who already have the achievement
      const awardedAchievements = await game.settings.get("fvtt-player-achievements", "awardedAchievements");
      const characters = awardedAchievements[achievementId] ?? [];
      const filteredUsers = currentUsers.filter((user) => {
        return !characters.includes(user.character?.uuid);
      });
      for (const user of filteredUsers) {
        await awardAchievement(achievementId, user.character?.uuid);
      }
    } else {
      await awardAchievement(achievementId, characterId);
    }

    this.render(true);
  }

  static async unassignAchievement(event) {
    event.preventDefault();
    const achievementId = event.currentTarget.dataset.achievement_id;
    const characterId = event.currentTarget.dataset.character_id;
    // get the player name for debug purposes
    if (characterId === "ALL") {
      const currentUserUUIDs = game.users.filter((user) => !user.isGM).map((user) => user.character?.uuid);
      await unAwardAchievement(achievementId, currentUserUUIDs);
    } else {
      await unAwardAchievement(achievementId, characterId);
    }

    setTimeout(() => {
      this.render(true);
    }, 100);
  }

  static toggleTagFilter(event) {
    event.preventDefault();
    const tag = event.currentTarget.dataset.achievement_tag;
    if (this.currentTagFilter.includes(tag)) {
      this.currentTagFilter = this.currentTagFilter.filter((t) => t !== tag);
    } else {
      this.currentTagFilter.push(tag);
    }
    this.render(true);
  }

  static onToggleHideAwarded(event) {
    event.preventDefault();
    this.hideAwarded = event.target.checked;
  }

  static onToggleHideUnawarded(event) {
    event.preventDefault();
    this.hideUnawarded = event.target.checked;
  }

  static onToggleHideDetails(event) {
    event.preventDefault();
    this.hideDetails = event.target.checked;
    this.render(true);
  }

  static onToggleOnlyOnline(event) {
    event.preventDefault();
    this.onlyOnline = event.target.checked;
    this.render(true);
  }

  static onSort(event) {
    event.preventDefault();
    this.sortza = !this.sortza;
    this.render(true);
  }

  static onSelectCharacter(event) {
    event.preventDefault();
    this.seluuid = event.target.value;
    this.render(true);
  }

  toggleImportDialog() {
    if (this.achievementsImportDialog?.rendered) {
      this.achievementsImportDialog.close();
    } else {
      this.achievementsImportDialog = new AchievementsImportDialog({ onFinished: this.onFinishedImport.bind(this) });
      this.achievementsImportDialog.render(true);
    }
  }

  static onImportAchievements(event) {
    event.preventDefault();
    this.toggleImportDialog();
  }

  async onFinishedImport() {
    this.achievements = await this.filterAchievements();
    setTimeout(() => {
      this.render(true);
    }, 100);
  }

  static onExportAchievements(event) {
    event.preventDefault();

    if (this.achievementsExportDialog?.rendered) {
      this.achievementsExportDialog.close();
    } else {
      this.achievementsExportDialog = new AchievementsExportDialog();
      this.achievementsExportDialog.render(true);
    }
  }

  static onCopyIdToClipboard(event) {
    const achievementId = event.currentTarget.dataset.achievement_id;
    if (!achievementId) return;
    navigator.clipboard.writeText(achievementId);
    ui.notifications.info(localize("fvtt-player-achievements.messages.achievement-id-copied"));
  }

  static onFeedback(event) {
    event.preventDefault();
    const newWindow = window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  static onBugReport(event) {
    event.preventDefault();
    const newWindow = window.open(BUGREPORT_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  static onDiscord(event) {
    event.preventDefault();
    const newWindow = window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }
}
