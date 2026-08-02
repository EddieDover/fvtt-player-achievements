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

/**
 * In-Foundry integration tests, run with the Quench module
 * (https://foundryvtt.com/packages/quench).
 */

import { MODULE_NAME } from "../constants.js";
import { awardAchievement, doesActorExist, unAwardAchievement } from "../core.js";
import { cleanString, deepCopy, enrichText, getFoundryVersion } from "../utils.js";

const WORLD_SETTING_KEYS = [
  "customAchievements",
  "awardedAchievements",
  "pendingAwardedAchievements",
  "lockedAchievements",
  "hideUnearnedAchievements",
  "cloakUnearnedAchievements",
  "showTagsToPlayers",
  "showOnlyToAwardedUser",
  "cloakTitleText",
  "cloakDescriptionText",
];

/**
 * Snapshot the module's world settings so tests can mutate them freely.
 * @returns {object} snapshot keyed by setting name
 */
function snapshotSettings() {
  const snapshot = {};
  for (const key of WORLD_SETTING_KEYS) {
    snapshot[key] = foundry.utils.deepClone(game.settings.get(MODULE_NAME, key));
  }
  return snapshot;
}

/**
 * Restore a settings snapshot taken with snapshotSettings().
 * @param {object} snapshot The snapshot to restore
 */
async function restoreSettings(snapshot) {
  for (const key of WORLD_SETTING_KEYS) {
    await game.settings.set(MODULE_NAME, key, snapshot[key]);
  }
}

/**
 * Reset the module's world data to a clean slate for deterministic tests.
 */
async function resetModuleData() {
  await game.settings.set(MODULE_NAME, "customAchievements", []);
  await game.settings.set(MODULE_NAME, "awardedAchievements", {});
  await game.settings.set(MODULE_NAME, "pendingAwardedAchievements", {});
  await game.settings.set(MODULE_NAME, "lockedAchievements", []);
  await game.settings.set(MODULE_NAME, "hideUnearnedAchievements", false);
  await game.settings.set(MODULE_NAME, "cloakUnearnedAchievements", false);
  await game.settings.set(MODULE_NAME, "showTagsToPlayers", true);
  await game.settings.set(MODULE_NAME, "showOnlyToAwardedUser", false);
}

/**
 * Pick a valid non-base Actor type for the running system.
 * @returns {string} an actor type
 */
function pickActorType() {
  const types = (game.documentTypes?.Actor ?? []).filter((t) => t !== "base");
  return types.includes("character") ? "character" : types[0];
}

/**
 * Build a plain achievement object for tests.
 * @param {object} overrides Property overrides
 * @returns {object} An achievement
 */
function makeAchievement(overrides = {}) {
  return {
    id: "quench-ach-1",
    title: "Quench Dragon Slayer",
    showTitleCloaked: false,
    description: "Slay a {b}quench{/b} dragon",
    image: "modules/fvtt-player-achievements/images/default.webp",
    cloakedImage: "modules/fvtt-player-achievements/images/default.webp",
    sound: "modules/fvtt-player-achievements/sounds/notification.ogg",
    tags: ["quench", "combat"],
    ...overrides,
  };
}

/**
 * Wait until a condition is true, polling every 50ms.
 * @param {() => boolean} condition Function returning truthy when done
 * @param {number} timeout Max time to wait, in ms
 * @returns {Promise<boolean>} true if the condition was met before the timeout
 */
async function waitFor(condition, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

/**
 * Find the rendered AchievementForm instance, if any.
 * @returns {object|undefined} the form application
 */
function findAchievementForm() {
  return [...foundry.applications.instances.values()].find(
    (app) => app.constructor.name === "AchievementForm" && app.rendered,
  );
}

/**
 * Register all Quench test batches for this module.
 * @param {object} quench The quench module api
 */
export function registerQuenchTests(quench) {
  registerUtilsBatch(quench);
  registerSettingsBatch(quench);
  registerCoreBatch(quench);
  registerApiBatch(quench);
  registerUiBatch(quench);
  registerUiInteractionsBatch(quench);
}

/**
 * Wait until the achievement sheet's DOM satisfies a condition, re-querying each poll.
 * @param {(root: HTMLElement) => boolean} condition Receives the sheet root element
 * @returns {Promise<boolean>} whether the condition was met
 */
function waitForSheet(condition) {
  return waitFor(() => {
    const root = findAchievementForm()?.element;
    return root ? condition(root) : false;
  });
}

/**
 * Find a rendered application instance by its constructor name.
 * @param {string} name The constructor name
 * @returns {object|undefined} the application
 */
function findApp(name) {
  return [...foundry.applications.instances.values()].find((app) => app.constructor.name === name && app.rendered);
}

/**
 * Wait for a rendered DialogV2 confirmation and click one of its buttons.
 * @param {"yes"|"no"} action The dialog button to click
 * @returns {Promise<boolean>} true if a dialog appeared and was clicked
 */
async function answerConfirmDialog(action) {
  const appeared = await waitFor(() => {
    const dialog = [...foundry.applications.instances.values()].find(
      (app) => app instanceof foundry.applications.api.DialogV2 && app.rendered,
    );
    return dialog?.element?.querySelector(`button[data-action="${action}"]`) !== null && dialog !== undefined;
  });
  if (!appeared) return false;
  const dialog = [...foundry.applications.instances.values()].find(
    (app) => app instanceof foundry.applications.api.DialogV2 && app.rendered,
  );
  dialog.element.querySelector(`button[data-action="${action}"]`).click();
  return true;
}

/**
 * Pure utility function tests.
 * @param {object} quench The quench module api
 */
function registerUtilsBatch(quench) {
  quench.registerBatch(
    `${MODULE_NAME}.utils`,
    (context) => {
      const { describe, it, assert } = context;

      describe("enrichText", () => {
        it("converts formatting tokens to html", () => {
          assert.equal(enrichText("{b}bold{/b}{nl}{i}italic{/i}"), "<b>bold</b><br><i>italic</i>");
        });
      });

      describe("cleanString", () => {
        it("escapes html-sensitive characters", () => {
          assert.equal(cleanString("<b>&</b>"), "&lt;b&gt;&amp;&lt;/b&gt;");
        });
      });

      describe("deepCopy", () => {
        it("produces an independent copy", () => {
          const original = { nested: { list: [1, 2] } };
          const copy = deepCopy(original);
          copy.nested.list.push(3);
          assert.lengthOf(original.nested.list, 2);
        });
      });

      describe("getFoundryVersion", () => {
        it("matches the running Foundry version", () => {
          const { major, minor } = getFoundryVersion();
          assert.equal(major, Number.parseInt(game.version.split(".")[0]));
          assert.equal(minor, Number.parseInt(game.version.split(".")[1]));
        });
      });
    },
    { displayName: "Player Achievements: Utils" },
  );
}

/**
 * Settings registration tests.
 * @param {object} quench The quench module api
 */
function registerSettingsBatch(quench) {
  quench.registerBatch(
    `${MODULE_NAME}.settings`,
    (context) => {
      const { describe, it, assert } = context;

      describe("module settings", () => {
        const allKeys = [...WORLD_SETTING_KEYS, "useAlternateButton", "defaultSoundFile", "playSelfSounds"];
        for (const key of allKeys) {
          it(`"${key}" is registered`, () => {
            assert.isTrue(game.settings.settings.has(`${MODULE_NAME}.${key}`));
          });
        }

        it("world data settings return usable defaults", () => {
          assert.isArray(game.settings.get(MODULE_NAME, "customAchievements"));
          assert.isObject(game.settings.get(MODULE_NAME, "awardedAchievements"));
          assert.isObject(game.settings.get(MODULE_NAME, "pendingAwardedAchievements"));
        });
      });
    },
    { displayName: "Player Achievements: Settings" },
  );
}

/**
 * Core CRUD and award lifecycle tests against real world settings.
 * @param {object} quench The quench module api
 */
function registerCoreBatch(quench) {
  quench.registerBatch(
    `${MODULE_NAME}.core`,
    (context) => {
      const { describe, it, assert, before, after, beforeEach, afterEach } = context;

      let snapshot;
      let testActor;
      let testUser;
      let createdMessageIds = [];
      let messageHookId;
      const api = game.modules.get(MODULE_NAME).api;

      before(async () => {
        if (!game.user.isGM) throw new Error("These tests must be run as GM.");
        snapshot = snapshotSettings();
        testActor = await Actor.create({ name: "Quench Test Hero", type: pickActorType() });
        testUser = await User.create({
          name: `Quench Test Player ${foundry.utils.randomID(4)}`,
          role: CONST.USER_ROLES.PLAYER,
          character: testActor.id,
        });
        messageHookId = Hooks.on("createChatMessage", (message) => createdMessageIds.push(message.id));
      });

      beforeEach(async () => {
        await resetModuleData();
      });

      after(async () => {
        Hooks.off("createChatMessage", messageHookId);
        if (createdMessageIds.length > 0) {
          await ChatMessage.deleteDocuments(createdMessageIds.filter((id) => game.messages.has(id)));
        }
        await testUser?.delete();
        await testActor?.delete();
        await restoreSettings(snapshot);
      });

      describe("achievement CRUD (via API)", () => {
        it("creates an achievement and finds it", async () => {
          const created = await api.createAchievement("quench-ach-1", "Quench Dragon Slayer", "Slay it");
          assert.equal(created.errorMessage, "");
          assert.equal(created.payload, "quench-ach-1");
          assert.isTrue((await api.doesAchievementExist("quench-ach-1")).payload);
        });

        it("generates an id when none is given", async () => {
          const created = await api.createAchievement("", "Untitled Feat", "Do a thing");
          assert.equal(created.errorMessage, "");
          assert.isString(created.payload);
          assert.isNotEmpty(created.payload);
        });

        it("rejects a duplicate id", async () => {
          await api.createAchievement("quench-ach-1", "First", "First");
          const duplicate = await api.createAchievement("quench-ach-1", "Second", "Second");
          assert.equal(duplicate.errorMessage, "Achievement already exists.");
        });

        it("edits an achievement", async () => {
          await api.createAchievement("quench-ach-1", "Before", "Before desc");
          const edited = await api.editAchievement("quench-ach-1", "After", "After desc");
          assert.isTrue(edited.payload);
          const achievements = (await api.getAchievements()).payload;
          assert.equal(achievements.find((a) => a.id === "quench-ach-1").title, "After");
        });

        it("deletes an achievement", async () => {
          await api.createAchievement("quench-ach-1", "Doomed", "Doomed");
          const deleted = await api.deleteAchievement("quench-ach-1");
          assert.isTrue(deleted.payload);
          assert.isFalse((await api.doesAchievementExist("quench-ach-1")).payload);
        });

        it("reports errors for missing achievements", async () => {
          assert.equal((await api.deleteAchievement("nope")).errorMessage, "Achievement does not exist.");
          assert.equal((await api.editAchievement("nope", "T", "D")).errorMessage, "Achievement does not exist.");
        });
      });

      describe("actors", () => {
        it("doesActorExist finds the test actor", () => {
          assert.isTrue(doesActorExist(testActor.uuid));
          assert.isFalse(doesActorExist("Actor.doesnotexist0000"));
        });
      });

      describe("award lifecycle (offline player)", () => {
        beforeEach(async () => {
          await game.settings.set(MODULE_NAME, "customAchievements", [makeAchievement()]);
        });

        it("records the award and queues it as pending", async () => {
          await awardAchievement("quench-ach-1", testActor.uuid);

          const awarded = game.settings.get(MODULE_NAME, "awardedAchievements");
          assert.deepEqual(awarded["quench-ach-1"], [testActor.uuid]);
          // The test user is not logged in, so the award should also pend.
          const pending = game.settings.get(MODULE_NAME, "pendingAwardedAchievements");
          assert.deepEqual(pending[testActor.uuid], ["quench-ach-1"]);
        });

        it("posts an achievement chat message", async () => {
          const messagesBefore = game.messages.size;
          await awardAchievement("quench-ach-1", testActor.uuid);
          const appeared = await waitFor(() => game.messages.size > messagesBefore);
          assert.isTrue(appeared, "expected a chat message to be created");
          const message = game.messages.contents.at(-1);
          assert.include(message.content, "Achievement Unlocked!");
          assert.include(message.content, "Quench Dragon Slayer");
        });

        it("does not award the same achievement twice", async () => {
          await awardAchievement("quench-ach-1", testActor.uuid);
          await awardAchievement("quench-ach-1", testActor.uuid);
          const awarded = game.settings.get(MODULE_NAME, "awardedAchievements");
          assert.lengthOf(awarded["quench-ach-1"], 1);
        });

        it("unAwardAchievement removes the award and pending entry", async () => {
          await awardAchievement("quench-ach-1", testActor.uuid);
          await unAwardAchievement("quench-ach-1", testActor.uuid);

          const awarded = game.settings.get(MODULE_NAME, "awardedAchievements");
          const pending = game.settings.get(MODULE_NAME, "pendingAwardedAchievements");
          assert.deepEqual(awarded["quench-ach-1"], []);
          assert.deepEqual(pending[testActor.uuid], []);
        });

        it("fires the unAwardAchievement hook", async () => {
          await awardAchievement("quench-ach-1", testActor.uuid);
          let hookArguments;
          const hookId = Hooks.on(`${MODULE_NAME}.unAwardAchievement`, (...received) => {
            hookArguments = received;
          });
          try {
            await unAwardAchievement("quench-ach-1", testActor.uuid);
          } finally {
            Hooks.off(`${MODULE_NAME}.unAwardAchievement`, hookId);
          }
          assert.deepEqual(hookArguments, ["quench-ach-1", testActor.uuid]);
        });
      });

      describe("award lifecycle (active user)", () => {
        let originalCharacterId;

        beforeEach(async () => {
          await game.settings.set(MODULE_NAME, "customAchievements", [makeAchievement()]);
          // Assign the test actor to the logged-in GM so the "active user" path runs.
          // eslint-disable-next-line unicorn/no-null -- Foundry needs null (not undefined) to clear the field on restore
          originalCharacterId = game.user.character?.id ?? null;
          await game.user.update({ character: testActor.id });
        });

        afterEach(async () => {
          await game.user.update({ character: originalCharacterId });
        });

        it("fires the awardAchievement hook for an online owner", async () => {
          let hookArguments;
          const hookId = Hooks.on(`${MODULE_NAME}.awardAchievement`, (...received) => {
            hookArguments = received;
          });
          try {
            await awardAchievement("quench-ach-1", testActor.uuid);
          } finally {
            Hooks.off(`${MODULE_NAME}.awardAchievement`, hookId);
          }
          assert.deepEqual(hookArguments, ["quench-ach-1", testActor.uuid]);
          // Nothing should pend for an online owner.
          const pending = game.settings.get(MODULE_NAME, "pendingAwardedAchievements");
          assert.notProperty(pending, testActor.uuid);
        });
      });

      describe("visibility rules", () => {
        beforeEach(async () => {
          await game.settings.set(MODULE_NAME, "customAchievements", [
            makeAchievement(),
            makeAchievement({ id: "quench-ach-2", title: "Quench Explorer", description: "Explore" }),
          ]);
          await game.settings.set(MODULE_NAME, "awardedAchievements", { "quench-ach-1": [testActor.uuid] });
        });

        it("hides unearned achievements from players", async () => {
          await game.settings.set(MODULE_NAME, "hideUnearnedAchievements", true);
          const result = await api.getAchievements({
            callingUser: testUser,
            callingCharacterId: testActor.uuid,
            showTags: true,
          });
          assert.deepEqual(
            result.payload.map((a) => a.id),
            ["quench-ach-1"],
          );
        });

        it("cloaks unearned achievements for players", async () => {
          await game.settings.set(MODULE_NAME, "cloakUnearnedAchievements", true);
          const cloakTitle = game.settings.get(MODULE_NAME, "cloakTitleText");
          const result = await api.getAchievements({
            callingUser: testUser,
            callingCharacterId: testActor.uuid,
            showTags: true,
          });
          const cloaked = result.payload.find((a) => a.id === "quench-ach-2");
          assert.equal(cloaked.title, cloakTitle);
          const earned = result.payload.find((a) => a.id === "quench-ach-1");
          assert.equal(earned.title, "Quench Dragon Slayer");
        });

        it("returns everything uncloaked to the GM", async () => {
          await game.settings.set(MODULE_NAME, "cloakUnearnedAchievements", true);
          const result = await api.getAchievements();
          assert.lengthOf(result.payload, 2);
          assert.equal(result.payload.find((a) => a.id === "quench-ach-2").title, "Quench Explorer");
        });

        it("strips tags when showTags is false", async () => {
          const result = await api.getAchievements({
            callingUser: testUser,
            callingCharacterId: testActor.uuid,
            showTags: false,
          });
          for (const achievement of result.payload) {
            assert.deepEqual(achievement.tags, []);
          }
        });
      });
    },
    { displayName: "Player Achievements: Core & Award Lifecycle" },
  );
}

/**
 * Public API surface tests (game.modules.get(...).api).
 * @param {object} quench The quench module api
 */
function registerApiBatch(quench) {
  quench.registerBatch(
    `${MODULE_NAME}.api`,
    (context) => {
      const { describe, it, assert, before, after, beforeEach } = context;

      let snapshot;
      let testActor;
      let testUser;
      let createdMessageIds = [];
      let messageHookId;
      const api = game.modules.get(MODULE_NAME).api;

      before(async () => {
        if (!game.user.isGM) throw new Error("These tests must be run as GM.");
        snapshot = snapshotSettings();
        testActor = await Actor.create({ name: "Quench API Hero", type: pickActorType() });
        testUser = await User.create({
          name: `Quench API Player ${foundry.utils.randomID(4)}`,
          role: CONST.USER_ROLES.PLAYER,
          character: testActor.id,
        });
        messageHookId = Hooks.on("createChatMessage", (message) => createdMessageIds.push(message.id));
      });

      beforeEach(async () => {
        await resetModuleData();
        await game.settings.set(MODULE_NAME, "customAchievements", [makeAchievement()]);
      });

      after(async () => {
        Hooks.off("createChatMessage", messageHookId);
        if (createdMessageIds.length > 0) {
          await ChatMessage.deleteDocuments(createdMessageIds.filter((id) => game.messages.has(id)));
        }
        await testUser?.delete();
        await testActor?.delete();
        await restoreSettings(snapshot);
      });

      describe("api registration", () => {
        it("is exposed on game.modules and on game", () => {
          assert.isObject(game.modules.get(MODULE_NAME).api);
          assert.isObject(game[MODULE_NAME]?.api);
          for (const fn of [
            "getAchievements",
            "awardAchievementToCharacter",
            "createAchievement",
            "editAchievement",
            "deleteAchievement",
            "doesCharacterHaveAchievement",
            "doesAchievementExist",
            "getAchievementsByCharacter",
            "removeAchievementFromCharacter",
            "toggleAchievementWindow",
          ]) {
            assert.isFunction(game.modules.get(MODULE_NAME).api[fn], `api.${fn} should be a function`);
          }
        });
      });

      describe("award / remove round trip", () => {
        it("awards an achievement to a character", async () => {
          const result = await api.awardAchievementToCharacter("quench-ach-1", testActor.uuid);
          assert.equal(result.errorMessage, "");
          assert.isTrue(result.payload);
          assert.isTrue((await api.doesCharacterHaveAchievement(testActor.uuid, "quench-ach-1")).payload);
        });

        it("accepts a bare actor id without the Actor. prefix", async () => {
          const result = await api.awardAchievementToCharacter("quench-ach-1", testActor.id);
          assert.isTrue(result.payload);
          assert.isTrue((await api.doesCharacterHaveAchievement(testActor.id, "quench-ach-1")).payload);
        });

        it("refuses to award twice", async () => {
          await api.awardAchievementToCharacter("quench-ach-1", testActor.uuid);
          const second = await api.awardAchievementToCharacter("quench-ach-1", testActor.uuid);
          assert.equal(second.errorMessage, "Character already has achievement.");
        });

        it("lists achievements by character", async () => {
          await api.awardAchievementToCharacter("quench-ach-1", testActor.uuid);
          const list = await api.getAchievementsByCharacter(testActor.uuid);
          assert.deepEqual(
            list.payload.map((a) => a.id),
            ["quench-ach-1"],
          );
        });

        it("removes an achievement from a character", async () => {
          await api.awardAchievementToCharacter("quench-ach-1", testActor.uuid);
          const removed = await api.removeAchievementFromCharacter("quench-ach-1", testActor.uuid);
          assert.isTrue(removed.payload);
          assert.isFalse((await api.doesCharacterHaveAchievement(testActor.uuid, "quench-ach-1")).payload);
        });

        it("reports errors for unknown achievements and actors", async () => {
          assert.equal(
            (await api.awardAchievementToCharacter("nope", testActor.uuid)).errorMessage,
            "Achievement does not exist.",
          );
          assert.equal(
            (await api.awardAchievementToCharacter("quench-ach-1", "Actor.doesnotexist0000")).errorMessage,
            "Character does not exist.",
          );
          assert.equal(
            (await api.removeAchievementFromCharacter("quench-ach-1", testActor.uuid)).errorMessage,
            "Character does not have achievement.",
          );
        });
      });
    },
    { displayName: "Player Achievements: Public API" },
  );
}

/**
 * UI smoke tests: achievement window and scene controls button.
 * @param {object} quench The quench module api
 */
function registerUiBatch(quench) {
  quench.registerBatch(
    `${MODULE_NAME}.ui`,
    (context) => {
      const { describe, it, assert, before, after, beforeEach } = context;

      let snapshot;
      const api = game.modules.get(MODULE_NAME).api;

      before(async () => {
        if (!game.user.isGM) throw new Error("These tests must be run as GM.");
        snapshot = snapshotSettings();
        await resetModuleData();
        await game.settings.set(MODULE_NAME, "customAchievements", [makeAchievement()]);
      });

      beforeEach(async () => {
        // Close any window left open by a previous test.
        const open = findAchievementForm();
        if (open) {
          await open.close();
          await waitFor(() => !findAchievementForm());
        }
      });

      after(async () => {
        const open = findAchievementForm();
        if (open) await open.close();
        await restoreSettings(snapshot);
      });

      describe("scene controls", () => {
        it("adds the achievements button", () => {
          assert.isNotNull(document.querySelector("#AchievementButton"));
        });
      });

      describe("achievement window", () => {
        it("opens via api.toggleAchievementWindow", async () => {
          api.toggleAchievementWindow();
          const rendered = await waitFor(() => findAchievementForm() !== undefined);
          assert.isTrue(rendered, "achievement window should render");
        });

        it("displays the test achievement", async () => {
          api.toggleAchievementWindow();
          await waitFor(() => findAchievementForm() !== undefined);
          const form = findAchievementForm();
          const appeared = await waitFor(() => form.element?.textContent.includes("Quench Dragon Slayer"));
          assert.isTrue(appeared, "achievement title should appear in the window");
        });

        it("closes via a second toggle", async () => {
          api.toggleAchievementWindow();
          await waitFor(() => findAchievementForm() !== undefined);
          api.toggleAchievementWindow();
          const closed = await waitFor(() => findAchievementForm() === undefined);
          assert.isTrue(closed, "achievement window should close");
        });
      });
    },
    { displayName: "Player Achievements: UI" },
  );
}

/**
 * Full UI interaction tests: drives the rendered sheet, forms, and dialogs
 * exactly as a user would — clicking buttons, filling fields, and answering
 * confirmation dialogs.
 * @param {object} quench The quench module api
 */
function registerUiInteractionsBatch(quench) {
  quench.registerBatch(
    `${MODULE_NAME}.ui-interactions`,
    (context) => {
      const { describe, it, assert, before, after, beforeEach } = context;

      let snapshot;
      let testActor;
      let testUser;
      let createdMessageIds = [];
      let messageHookId;
      const api = game.modules.get(MODULE_NAME).api;

      /**
       * Ensure the achievement sheet is open, freshly rendered, and returns it.
       * @returns {Promise<object>} the AchievementForm application
       */
      async function openSheet() {
        let form = findAchievementForm();
        if (form) {
          await form.render(true);
        } else {
          api.toggleAchievementWindow();
          await waitFor(() => findAchievementForm() !== undefined);
          form = findAchievementForm();
        }
        await waitFor(() => form.element?.querySelector(".achievement-block, .achievements-sheet__filter"));
        return form;
      }

      before(async function () {
        this.timeout(15_000);
        if (!game.user.isGM) throw new Error("These tests must be run as GM.");
        snapshot = snapshotSettings();
        testActor = await Actor.create({ name: "Quench UI Hero", type: pickActorType() });
        testUser = await User.create({
          name: `Quench UI Player ${foundry.utils.randomID(4)}`,
          role: CONST.USER_ROLES.PLAYER,
          character: testActor.id,
        });
        messageHookId = Hooks.on("createChatMessage", (message) => createdMessageIds.push(message.id));
      });

      beforeEach(async function () {
        this.timeout(15_000);
        await resetModuleData();
        await game.settings.set(MODULE_NAME, "customAchievements", [
          makeAchievement(),
          makeAchievement({ id: "quench-ach-2", title: "Alpha Feat", description: "Be first", tags: ["order"] }),
        ]);
        // Close any leftover child windows from a previous test.
        for (const name of ["AddAchievementForm", "AchievementsImportDialog", "AchievementsExportDialog"]) {
          const app = findApp(name);
          if (app) await app.close();
        }
        // Close and reopen the sheet so every test starts with a fresh
        // instance (filter/tag/sort state lives on the form object).
        const staleSheet = findAchievementForm();
        if (staleSheet) {
          await staleSheet.close();
          await waitFor(() => findAchievementForm() === undefined);
        }
        await openSheet();
      });

      after(async function () {
        this.timeout(15_000);
        Hooks.off("createChatMessage", messageHookId);
        if (createdMessageIds.length > 0) {
          await ChatMessage.deleteDocuments(createdMessageIds.filter((id) => game.messages.has(id)));
        }
        for (const name of ["AddAchievementForm", "AchievementsImportDialog", "AchievementsExportDialog"]) {
          const app = findApp(name);
          if (app) await app.close();
        }
        const sheet = findAchievementForm();
        if (sheet) await sheet.close();
        await testUser?.delete();
        await testActor?.delete();
        await restoreSettings(snapshot);
      });

      describe("sheet rendering", function () {
        this.timeout(10_000);

        it("renders one block per achievement", async () => {
          const shown = await waitForSheet((root) => root.querySelectorAll(".achievement-block").length === 2);
          assert.isTrue(shown, "expected two achievement blocks");
        });
      });

      describe("adding and editing via the form", function () {
        this.timeout(15_000);

        it("adds an achievement through the add form", async () => {
          const sheet = findAchievementForm();
          sheet.element.querySelector('[data-action="onAddAchievement"]').click();
          const opened = await waitFor(() => findApp("AddAchievementForm") !== undefined);
          assert.isTrue(opened, "add form should open");
          const addForm = findApp("AddAchievementForm");

          // setupDefaults fills id/image/sound asynchronously; wait for the id.
          await waitFor(() => addForm.element.querySelector('[name="achievement_id"]').value !== "");
          addForm.element.querySelector('[name="achievement_title"]').value = "Button Made Feat";
          addForm.element.querySelector('[name="achievement_description"]').value = "Made by clicking";
          addForm.element.querySelector('[name="achievement_tags"]').value = "ui, quench";

          addForm.element.querySelector('[data-action="onSubmit"]').click();

          const saved = await waitFor(() =>
            game.settings.get(MODULE_NAME, "customAchievements").some((a) => a.title === "Button Made Feat"),
          );
          assert.isTrue(saved, "achievement should be saved from the form");
          const created = game.settings
            .get(MODULE_NAME, "customAchievements")
            .find((a) => a.title === "Button Made Feat");
          assert.deepEqual(created.tags, ["ui", "quench"]);
          // The sheet re-renders (after a 350ms delay) and shows the new block.
          const shown = await waitForSheet((root) => root.textContent.includes("Button Made Feat"));
          assert.isTrue(shown, "new achievement should appear on the sheet");
        });

        it("edits an achievement through the edit form", async () => {
          const sheet = findAchievementForm();
          sheet.element.querySelector('[data-action="onEditAchievement"][data-achievement_id="quench-ach-2"]').click();
          await waitFor(() => findApp("AddAchievementForm") !== undefined);
          const editForm = findApp("AddAchievementForm");

          const titleInput = editForm.element.querySelector('[name="achievement_title"]');
          await waitFor(() => titleInput.value === "Alpha Feat");
          titleInput.value = "Alpha Feat (Edited)";
          editForm.element.querySelector('[data-action="onSubmit"]').click();

          const saved = await waitFor(
            () =>
              game.settings.get(MODULE_NAME, "customAchievements").find((a) => a.id === "quench-ach-2")?.title ===
              "Alpha Feat (Edited)",
          );
          assert.isTrue(saved, "edited title should be saved");
        });
      });

      describe("awarding via sheet buttons", function () {
        this.timeout(15_000);

        it("assigns an achievement by clicking its assign button", async () => {
          const sheet = findAchievementForm();
          const button = sheet.element.querySelector(
            `button.assign[data-achievement_id="quench-ach-1"][data-character_id="${testActor.uuid}"]`,
          );
          assert.isNotNull(button, "assign button for the test character should render");
          button.click();

          const awarded = await waitFor(() =>
            (game.settings.get(MODULE_NAME, "awardedAchievements")["quench-ach-1"] ?? []).includes(testActor.uuid),
          );
          assert.isTrue(awarded, "clicking assign should award the achievement");
          // After the re-render the same character now has an unassign button.
          const flipped = await waitForSheet(
            (root) =>
              root.querySelector(
                `button.unassign[data-achievement_id="quench-ach-1"][data-character_id="${testActor.uuid}"]`,
              ) !== null,
          );
          assert.isTrue(flipped, "assign button should become unassign after awarding");
        });

        it("unassigns an achievement by clicking its unassign button", async () => {
          await api.awardAchievementToCharacter("quench-ach-1", testActor.uuid);
          await openSheet();

          const sheet = findAchievementForm();
          const button = sheet.element.querySelector(
            `button.unassign[data-achievement_id="quench-ach-1"][data-character_id="${testActor.uuid}"]`,
          );
          assert.isNotNull(button, "unassign button should render for an awarded character");
          button.click();

          const removed = await waitFor(
            () =>
              !(game.settings.get(MODULE_NAME, "awardedAchievements")["quench-ach-1"] ?? []).includes(testActor.uuid),
          );
          assert.isTrue(removed, "clicking unassign should remove the award");
        });

        it("assigns to ALL characters via the all-actors button", async () => {
          const sheet = findAchievementForm();
          sheet.element
            .querySelector('button.assign[data-achievement_id="quench-ach-1"][data-character_id="ALL"]')
            .click();
          const awarded = await waitFor(() =>
            (game.settings.get(MODULE_NAME, "awardedAchievements")["quench-ach-1"] ?? []).includes(testActor.uuid),
          );
          assert.isTrue(awarded, "ALL assignment should award every player character");
        });
      });

      describe("deleting via sheet button", function () {
        this.timeout(15_000);

        it("deletes after accepting the confirmation dialog", async () => {
          const sheet = findAchievementForm();
          sheet.element
            .querySelector('[data-action="onDeleteAchievement"][data-achievement_id="quench-ach-2"]')
            .click();

          const answered = await answerConfirmDialog("yes");
          assert.isTrue(answered, "confirmation dialog should appear");

          const deleted = await waitFor(
            () => !game.settings.get(MODULE_NAME, "customAchievements").some((a) => a.id === "quench-ach-2"),
          );
          assert.isTrue(deleted, "achievement should be deleted after confirming");
        });

        it("deletes correctly when the click lands on the button's icon", async () => {
          // Regression: clicking the <i> icon used to yield an undefined id,
          // which deleted the LAST achievement in the list.
          const sheet = findAchievementForm();
          const icon = sheet.element.querySelector(
            '[data-action="onDeleteAchievement"][data-achievement_id="quench-ach-2"] i',
          );
          assert.isNotNull(icon, "delete button icon should render");
          icon.click();

          const answered = await answerConfirmDialog("yes");
          assert.isTrue(answered, "confirmation dialog should appear");

          const deleted = await waitFor(
            () => !game.settings.get(MODULE_NAME, "customAchievements").some((a) => a.id === "quench-ach-2"),
          );
          assert.isTrue(deleted, "the clicked achievement should be the one deleted");
          assert.isTrue(
            game.settings.get(MODULE_NAME, "customAchievements").some((a) => a.id === "quench-ach-1"),
            "other achievements should survive",
          );
        });

        it("keeps the achievement when the dialog is declined", async () => {
          const sheet = findAchievementForm();
          sheet.element
            .querySelector('[data-action="onDeleteAchievement"][data-achievement_id="quench-ach-2"]')
            .click();

          const answered = await answerConfirmDialog("no");
          assert.isTrue(answered, "confirmation dialog should appear");
          // Give a would-be delete time to land, then verify nothing changed.
          await new Promise((resolve) => setTimeout(resolve, 500));
          assert.isTrue(game.settings.get(MODULE_NAME, "customAchievements").some((a) => a.id === "quench-ach-2"));
        });
      });

      describe("locking", function () {
        this.timeout(15_000);

        it("locks and unlocks an achievement", async () => {
          const sheet = findAchievementForm();
          sheet.element.querySelector('[data-action="onToggleLock"][data-achievement_id="quench-ach-1"]').click();

          const locked = await waitFor(() =>
            game.settings.get(MODULE_NAME, "lockedAchievements").includes("quench-ach-1"),
          );
          assert.isTrue(locked, "achievement should be locked");
          // A locked achievement's block loses its delete button.
          const deleteGone = await waitForSheet(
            (root) =>
              root.querySelector('[data-action="onDeleteAchievement"][data-achievement_id="quench-ach-1"]') === null,
          );
          assert.isTrue(deleteGone, "locked achievement should not offer delete");

          findAchievementForm()
            .element.querySelector('[data-action="onToggleLock"][data-achievement_id="quench-ach-1"]')
            .click();
          const unlocked = await waitFor(
            () => !game.settings.get(MODULE_NAME, "lockedAchievements").includes("quench-ach-1"),
          );
          assert.isTrue(unlocked, "achievement should unlock again");
        });
      });

      describe("filtering and sorting", function () {
        this.timeout(15_000);

        it("filters achievements from the filter input", async () => {
          const sheet = findAchievementForm();
          sheet.element.querySelector("#achievement_filter_input").value = "dragon";
          sheet.element.querySelector('[data-action="onFilterChange"]').click();

          const filtered = await waitForSheet(
            (root) =>
              root.querySelectorAll(".achievement-block").length === 1 &&
              root.textContent.includes("Quench Dragon Slayer"),
          );
          assert.isTrue(filtered, "only the matching achievement should remain");

          const refreshed = findAchievementForm();
          refreshed.element.querySelector("#achievement_filter_input").value = "";
          refreshed.element.querySelector('[data-action="onFilterChange"]').click();
          const unfiltered = await waitForSheet((root) => root.querySelectorAll(".achievement-block").length === 2);
          assert.isTrue(unfiltered, "clearing the filter should restore all achievements");
        });

        it("filters by tag when a tag is clicked", async () => {
          const sheet = findAchievementForm();
          const tag = sheet.element.querySelector('[data-action="toggleTagFilter"][data-achievement_tag="order"]');
          assert.isNotNull(tag, "tag chip should render");
          tag.click();
          const filtered = await waitForSheet((root) => root.querySelectorAll(".achievement-block").length === 1);
          assert.isTrue(filtered, "tag filter should narrow the list");
        });

        it("reverses order when sort is clicked", async () => {
          const startsAlpha = await waitForSheet((root) =>
            (root.querySelector(".achievement-block")?.textContent ?? "").includes("Alpha Feat"),
          );
          assert.isTrue(startsAlpha, "ascending sort should show Alpha Feat first");

          findAchievementForm().element.querySelector('[data-action="onSort"]').click();
          const flipped = await waitForSheet((root) =>
            (root.querySelector(".achievement-block")?.textContent ?? "").includes("Quench Dragon Slayer"),
          );
          assert.isTrue(flipped, "descending sort should show Quench Dragon Slayer first");
        });

        it("wires up the GM visibility checkboxes", async () => {
          const sheet = findAchievementForm();
          // hide-awarded / hide-unawarded are player-only controls.
          assert.isNull(sheet.element.querySelector("#hide-awarded"), "hide-awarded should not render for the GM");
          assert.isNull(sheet.element.querySelector("#hide-unawarded"), "hide-unawarded should not render for the GM");

          sheet.element.querySelector("#hide-details").click();
          const detailsHidden = await waitFor(() => findAchievementForm()?.hideDetails === true);
          assert.isTrue(detailsHidden, "hide-details flag should be set");
          // Achievement images are hidden when details are hidden.
          const imagesGone = await waitForSheet((root) => root.querySelector(".achievement-block__image") === null);
          assert.isTrue(imagesGone, "achievement images should be hidden");

          findAchievementForm().element.querySelector("#only-online").click();
          const onlyOnline = await waitFor(() => findAchievementForm()?.onlyOnline === true);
          assert.isTrue(onlyOnline, "only-online flag should be set");
        });
      });

      describe("export and import dialogs", function () {
        this.timeout(15_000);

        it("exports the current achievements as JSON", async () => {
          const sheet = findAchievementForm();
          sheet.element.querySelector('[data-action="onExportAchievements"]').click();
          const opened = await waitFor(() => findApp("AchievementsExportDialog") !== undefined);
          assert.isTrue(opened, "export dialog should open");

          const exportDialog = findApp("AchievementsExportDialog");
          await waitFor(() => exportDialog.element.querySelector(".fpa-export-data") !== null);
          const exported = JSON.parse(exportDialog.element.querySelector(".fpa-export-data").value);
          assert.deepEqual(exported.map((a) => a.id).toSorted(), ["quench-ach-1", "quench-ach-2"]);
          await exportDialog.close();
        });

        it("imports achievements pasted into the import dialog", async () => {
          const importPayload = [
            {
              id: "quench-imported-1",
              title: "Imported Feat",
              showTitleCloaked: false,
              description: "Came from JSON",
              image: "modules/fvtt-player-achievements/images/default.webp",
              cloakedImage: "modules/fvtt-player-achievements/images/default.webp",
              sound: "modules/fvtt-player-achievements/sounds/notification.ogg",
              tags: ["imported"],
              completedActors: [testActor.uuid],
            },
          ];

          const sheet = findAchievementForm();
          sheet.element.querySelector('[data-action="onImportAchievements"]').click();
          const opened = await waitFor(() => findApp("AchievementsImportDialog") !== undefined);
          assert.isTrue(opened, "import dialog should open");

          const importDialog = findApp("AchievementsImportDialog");
          await waitFor(() => importDialog.element.querySelector('textarea[name="fpa-import-data"]') !== null);
          importDialog.element.querySelector('textarea[name="fpa-import-data"]').value = JSON.stringify(importPayload);
          importDialog.element.querySelector('[data-action="onImport"]').click();

          const answered = await answerConfirmDialog("yes");
          assert.isTrue(answered, "import confirmation dialog should appear");

          const imported = await waitFor(() =>
            game.settings.get(MODULE_NAME, "customAchievements").some((a) => a.id === "quench-imported-1"),
          );
          assert.isTrue(imported, "imported achievement should replace the stored list");
          assert.lengthOf(game.settings.get(MODULE_NAME, "customAchievements"), 1);
          assert.deepEqual(game.settings.get(MODULE_NAME, "awardedAchievements")["quench-imported-1"], [
            testActor.uuid,
          ]);
          const closed = await waitFor(() => findApp("AchievementsImportDialog") === undefined);
          assert.isTrue(closed, "import dialog should close after importing");
        });
      });

      describe("clipboard", function () {
        this.timeout(10_000);

        it("copies an achievement id via its copy button", async () => {
          const written = [];
          const originalDescriptor = Object.getOwnPropertyDescriptor(navigator.clipboard, "writeText");
          Object.defineProperty(navigator.clipboard, "writeText", {
            value: (text) => {
              written.push(text);
              return Promise.resolve();
            },
            configurable: true,
          });

          try {
            const sheet = findAchievementForm();
            const button = sheet.element.querySelector(
              '[data-action="onCopyIdToClipboard"][data-achievement_id="quench-ach-1"]',
            );
            assert.isNotNull(button, "copy-id button should render");
            button.click();
            await waitFor(() => written.length > 0);
            assert.deepEqual(written, ["quench-ach-1"]);
          } finally {
            if (originalDescriptor) {
              Object.defineProperty(navigator.clipboard, "writeText", originalDescriptor);
            } else {
              delete navigator.clipboard.writeText;
            }
          }
        });
      });
    },
    { displayName: "Player Achievements: UI Interactions" },
  );
}
