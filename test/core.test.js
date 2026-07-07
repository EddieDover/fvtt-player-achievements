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

import {
  awardAchievement,
  createAchievement,
  deleteAchievement,
  doesActorExist,
  editAchievement,
  generateUniqueId,
  getAchievements,
  pendAwardAchievement,
  setupAchievementSocket,
  unAwardAchievement,
} from "../src/module/core.js";
import { createMockCharacter, createMockUser, setupFoundryEnvironment } from "./setup/foundry-mocks.js";

const MODULE_SOCKET = "module.fvtt-player-achievements";

/**
 * Build a plain achievement object for tests.
 * @param {object} overrides Property overrides
 * @returns {object} An achievement
 */
function makeAchievement(overrides = {}) {
  return {
    id: "ach1",
    title: "Dragon Slayer",
    showTitleCloaked: false,
    description: "Slay a dragon",
    image: "images/dragon.webp",
    cloakedImage: "images/cloaked.webp",
    sound: "sounds/fanfare.ogg",
    tags: ["combat"],
    ...overrides,
  };
}

describe("achievement CRUD", () => {
  beforeEach(() => {
    setupFoundryEnvironment();
  });

  it("createAchievement appends to the customAchievements setting", async () => {
    await createAchievement(makeAchievement());
    await createAchievement(makeAchievement({ id: "ach2", title: "Second" }));

    const stored = game.settings.get("fvtt-player-achievements", "customAchievements");
    expect(stored).toHaveLength(2);
    expect(stored[0].title).toBe("Dragon Slayer");
  });

  it("createAchievement falls back to default image and sound", async () => {
    await createAchievement(makeAchievement({ image: undefined, cloakedImage: undefined, sound: undefined }));

    const [stored] = game.settings.get("fvtt-player-achievements", "customAchievements");
    expect(stored.image).toBeTruthy();
    expect(stored.cloakedImage).toBeTruthy();
    expect(stored.sound).toBeTruthy();
  });

  it("editAchievement replaces the matching achievement", async () => {
    await createAchievement(makeAchievement());
    await editAchievement(makeAchievement({ title: "Renamed" }));

    const [stored] = game.settings.get("fvtt-player-achievements", "customAchievements");
    expect(stored.title).toBe("Renamed");
  });

  it("editAchievement does nothing for an unknown id", async () => {
    await createAchievement(makeAchievement());
    await editAchievement(makeAchievement({ id: "missing", title: "Renamed" }));

    const [stored] = game.settings.get("fvtt-player-achievements", "customAchievements");
    expect(stored.title).toBe("Dragon Slayer");
  });

  it("deleteAchievement removes the achievement and its awards", async () => {
    await createAchievement(makeAchievement());
    await game.settings.set("fvtt-player-achievements", "awardedAchievements", { ach1: ["Actor.char1"] });

    await deleteAchievement("ach1");

    expect(game.settings.get("fvtt-player-achievements", "customAchievements")).toHaveLength(0);
    expect(game.settings.get("fvtt-player-achievements", "awardedAchievements")).toEqual({});
  });

  it("deleteAchievement leaves the list untouched for an unknown id", async () => {
    await createAchievement(makeAchievement());

    await deleteAchievement();
    await deleteAchievement("missing");

    expect(game.settings.get("fvtt-player-achievements", "customAchievements")).toHaveLength(1);
  });

  it("generateUniqueId returns an id not used by existing achievements", async () => {
    await createAchievement(makeAchievement());
    const id = await generateUniqueId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(id).not.toBe("ach1");
  });
});

describe("awarding achievements", () => {
  let environment;
  let player;
  let character;

  beforeEach(() => {
    character = createMockCharacter({ id: "char1", name: "Hero" });
    player = createMockUser({ id: "player1", name: "Alice", character, active: true });
    environment = setupFoundryEnvironment({
      users: [player],
      actors: [character],
    });
  });

  it("awards an achievement to an active character and fires the hook", async () => {
    await createAchievement(makeAchievement());

    await awardAchievement("ach1", "Actor.char1");

    const awarded = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    expect(awarded.ach1).toEqual(["Actor.char1"]);
    expect(environment.Hooks.call).toHaveBeenCalledWith(
      "fvtt-player-achievements.awardAchievement",
      "ach1",
      "Actor.char1",
    );
    expect(environment.chatMessages).toHaveLength(1);
    expect(environment.chatMessages[0].content).toContain("Dragon Slayer");
  });

  it("does not duplicate an award for the same character", async () => {
    await createAchievement(makeAchievement());

    await awardAchievement("ach1", "Actor.char1");
    await awardAchievement("ach1", "Actor.char1");

    const awarded = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    expect(awarded.ach1).toEqual(["Actor.char1"]);
  });

  it("ignores awards for characters with no owning user", async () => {
    await createAchievement(makeAchievement());

    await awardAchievement("ach1", "Actor.nobody");

    const awarded = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    expect(awarded.ach1).toBeUndefined();
  });

  it("queues the award as pending when the owning user is offline", async () => {
    player.active = false;
    await createAchievement(makeAchievement());

    await awardAchievement("ach1", "Actor.char1");

    const pending = game.settings.get("fvtt-player-achievements", "pendingAwardedAchievements");
    expect(pending["Actor.char1"]).toEqual(["ach1"]);
    expect(environment.Hooks.call).not.toHaveBeenCalledWith(
      "fvtt-player-achievements.awardAchievement",
      expect.anything(),
      expect.anything(),
    );
  });

  it("whispers the chat message when showOnlyToAwardedUser is enabled", async () => {
    await game.settings.set("fvtt-player-achievements", "showOnlyToAwardedUser", true);
    await createAchievement(makeAchievement());

    await awardAchievement("ach1", "Actor.char1");

    expect(environment.chatMessages[0].whisper).toEqual(["player1"]);
  });

  it("pendAwardAchievement accumulates unique pending awards per character", async () => {
    await pendAwardAchievement("ach1", "Actor.char1");
    await pendAwardAchievement("ach2", "Actor.char1");
    await pendAwardAchievement("ach1", "Actor.char1");

    const pending = game.settings.get("fvtt-player-achievements", "pendingAwardedAchievements");
    expect(pending["Actor.char1"]).toEqual(["ach1", "ach2"]);
  });

  it("unAwardAchievement removes the award and any pending entry", async () => {
    await createAchievement(makeAchievement());
    await awardAchievement("ach1", "Actor.char1");
    await pendAwardAchievement("ach1", "Actor.char1");

    await unAwardAchievement("ach1", "Actor.char1");

    const awarded = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    const pending = game.settings.get("fvtt-player-achievements", "pendingAwardedAchievements");
    expect(awarded.ach1).toEqual([]);
    expect(pending["Actor.char1"]).toEqual([]);
    expect(environment.Hooks.call).toHaveBeenCalledWith(
      "fvtt-player-achievements.unAwardAchievement",
      "ach1",
      "Actor.char1",
    );
  });

  it("unAwardAchievement handles an array of character ids", async () => {
    const character2 = createMockCharacter({ id: "char2", name: "Sidekick" });
    const player2 = createMockUser({ id: "player2", name: "Bob", character: character2 });
    game.users.push(player2);
    await createAchievement(makeAchievement());
    await awardAchievement("ach1", "Actor.char1");
    await awardAchievement("ach1", "Actor.char2");

    await unAwardAchievement("ach1", ["Actor.char1", "Actor.char2"]);

    const awarded = game.settings.get("fvtt-player-achievements", "awardedAchievements");
    expect(awarded.ach1).toEqual([]);
  });
});

describe("getAchievements (as GM)", () => {
  let player;
  let character;

  beforeEach(async () => {
    character = createMockCharacter({ id: "char1", name: "Hero" });
    player = createMockUser({ id: "player1", name: "Alice", character });
    setupFoundryEnvironment({ users: [player], actors: [character] });

    await createAchievement(makeAchievement());
    await createAchievement(makeAchievement({ id: "ach2", title: "Explorer", description: "Explore" }));
    await game.settings.set("fvtt-player-achievements", "awardedAchievements", { ach1: ["Actor.char1"] });
  });

  it("returns all achievements with completedActors hydrated", async () => {
    const achievements = await getAchievements();

    expect(achievements).toHaveLength(2);
    expect(achievements.find((a) => a.id === "ach1").completedActors).toEqual(["Actor.char1"]);
    expect(achievements.find((a) => a.id === "ach2").completedActors).toEqual([]);
  });

  it("hides unearned achievements from players when hideUnearnedAchievements is on", async () => {
    await game.settings.set("fvtt-player-achievements", "hideUnearnedAchievements", true);

    const achievements = await getAchievements({
      callingUser: player,
      callingCharacterId: "Actor.char1",
      showTags: true,
    });

    expect(achievements.map((a) => a.id)).toEqual(["ach1"]);
  });

  it("cloaks unearned achievements when cloakUnearnedAchievements is on", async () => {
    await game.settings.set("fvtt-player-achievements", "cloakUnearnedAchievements", true);

    const achievements = await getAchievements({
      callingUser: player,
      callingCharacterId: "Actor.char1",
      showTags: true,
    });

    const cloaked = achievements.find((a) => a.id === "ach2");
    expect(cloaked.title).toBe("HIDDEN");
    expect(cloaked.description).toBe("HIDDEN");
    expect(cloaked.image).toBe("images/cloaked.webp");
    const earned = achievements.find((a) => a.id === "ach1");
    expect(earned.title).toBe("Dragon Slayer");
  });

  it("keeps the title visible for cloaked achievements with showTitleCloaked", async () => {
    await game.settings.set("fvtt-player-achievements", "cloakUnearnedAchievements", true);
    await editAchievement(makeAchievement({ id: "ach2", title: "Explorer", showTitleCloaked: true }));

    const achievements = await getAchievements({
      callingUser: player,
      callingCharacterId: "Actor.char1",
      showTags: true,
    });

    expect(achievements.find((a) => a.id === "ach2").title).toBe("Explorer");
  });

  it("strips tags when showTags is false", async () => {
    const achievements = await getAchievements({
      callingUser: player,
      callingCharacterId: "Actor.char1",
      showTags: false,
    });

    for (const achievement of achievements) {
      expect(achievement.tags).toEqual([]);
    }
  });

  it("does not mutate the stored achievements when cloaking", async () => {
    await game.settings.set("fvtt-player-achievements", "cloakUnearnedAchievements", true);

    await getAchievements({ callingUser: player, callingCharacterId: "Actor.char1", showTags: true });

    const stored = game.settings.get("fvtt-player-achievements", "customAchievements");
    expect(stored.find((a) => a.id === "ach2").title).toBe("Explorer");
  });

  it("throws on duplicate achievement ids", async () => {
    const stored = game.settings.get("fvtt-player-achievements", "customAchievements");
    stored.push({ ...stored[0] });

    await expect(getAchievements()).rejects.toThrow("Duplicate achievement ids found");
  });
});

describe("getAchievements (as player over socket)", () => {
  it("emits a request to the GM and resolves with the response", async () => {
    const character = createMockCharacter({ id: "char1" });
    const player = createMockUser({ id: "player1", name: "Alice", character, isGM: false });
    const environment = setupFoundryEnvironment({ user: player });

    const promise = getAchievements();
    // Let the async function get past its internal awaits so it emits the request.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The player should have emitted a request over the socket.
    const request = environment.socket.emitted.find((e) => e.data.type === "getAchievements");
    expect(request).toBeDefined();
    expect(request.event).toBe(MODULE_SOCKET);
    expect(request.data.payload.callingCharacterId).toBe("Actor.char1");

    // Simulate the GM's response arriving.
    const result = [makeAchievement()];
    await environment.socket.receive(MODULE_SOCKET, {
      type: "getAchievementsResponse",
      payload: { requestId: request.data.payload.requestId, result },
    });

    await expect(promise).resolves.toEqual(result);
  });
});

describe("setupAchievementSocket (GM side)", () => {
  it("responds to getAchievements requests from players", async () => {
    const character = createMockCharacter({ id: "char1" });
    const player = createMockUser({ id: "player1", name: "Alice", character });
    const environment = setupFoundryEnvironment({ users: [player], actors: [character] });
    await createAchievement(makeAchievement());

    setupAchievementSocket();
    await environment.socket.receive(MODULE_SOCKET, {
      type: "getAchievements",
      payload: {
        requestId: "req-1",
        callingUser: { id: "player1" },
        callingCharacterId: "Actor.char1",
        showTags: true,
      },
    });

    const response = environment.socket.emitted.find((e) => e.data.type === "getAchievementsResponse");
    expect(response).toBeDefined();
    expect(response.data.payload.requestId).toBe("req-1");
    expect(response.data.payload.result).toHaveLength(1);
  });

  it("ignores GM-only requests when the current user is not a GM", async () => {
    const player = createMockUser({ id: "player1", name: "Alice" });
    const environment = setupFoundryEnvironment({ user: player });

    setupAchievementSocket();
    await environment.socket.receive(MODULE_SOCKET, {
      type: "getAchievements",
      payload: { requestId: "req-1", callingUser: { id: "player1" }, callingCharacterId: "", showTags: true },
    });

    expect(environment.socket.emitted.find((e) => e.data.type === "getAchievementsResponse")).toBeUndefined();
  });
});

describe("doesActorExist", () => {
  it("finds non-npc actors by uuid", () => {
    const hero = createMockCharacter({ id: "char1" });
    const npc = createMockCharacter({ id: "npc1", type: "npc" });
    setupFoundryEnvironment({ actors: [hero, npc] });

    expect(doesActorExist("Actor.char1")).toBe(true);
    expect(doesActorExist("Actor.npc1")).toBe(false);
    expect(doesActorExist("Actor.missing")).toBe(false);
  });
});
