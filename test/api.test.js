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

import api from "../src/module/api.js";
import { createMockCharacter, createMockUser, setupFoundryEnvironment } from "./setup/foundry-mocks.js";

let character;

beforeEach(async () => {
  character = createMockCharacter({ id: "char1", name: "Hero" });
  const player = createMockUser({ id: "player1", name: "Alice", character });
  setupFoundryEnvironment({ users: [player], actors: [character] });
  await api.createAchievement("ach1", "Dragon Slayer", "Slay a dragon");
});

describe("createAchievement", () => {
  it("creates and reports the achievement", async () => {
    expect((await api.doesAchievementExist("ach1")).payload).toBe(true);
  });

  it("generates an id when none is given", async () => {
    const created = await api.createAchievement("", "Untitled", "Something");
    expect(created.errorMessage).toBe("");
    expect(created.payload).not.toBe("");
  });

  it("rejects duplicate ids", async () => {
    const duplicate = await api.createAchievement("ach1", "Again", "Again");
    expect(duplicate.errorMessage).toBe("Achievement already exists.");
  });

  it("rejects missing required fields", async () => {
    const bad = await api.createAchievement("ach2", "", "desc");
    expect(bad.errorMessage).toBe("Missing required field(s).");
  });
});

describe("editAchievement", () => {
  it("edits an existing achievement", async () => {
    const edited = await api.editAchievement("ach1", "Renamed", "New desc");
    expect(edited.payload).toBe(true);
    const achievements = (await api.getAchievements()).payload;
    expect(achievements.find((a) => a.id === "ach1").title).toBe("Renamed");
  });

  it("errors for unknown achievements", async () => {
    const edited = await api.editAchievement("missing", "T", "D");
    expect(edited.errorMessage).toBe("Achievement does not exist.");
  });
});

describe("deleteAchievement", () => {
  it("deletes an existing achievement", async () => {
    const deleted = await api.deleteAchievement("ach1");
    expect(deleted.payload).toBe(true);
    expect((await api.doesAchievementExist("ach1")).payload).toBe(false);
  });

  it("errors for unknown achievements", async () => {
    expect((await api.deleteAchievement("missing")).errorMessage).toBe("Achievement does not exist.");
  });
});

describe("award and remove round trip", () => {
  it("awards an achievement to a character", async () => {
    const result = await api.awardAchievementToCharacter("ach1", "Actor.char1");
    expect(result.errorMessage).toBe("");
    expect(result.payload).toBe(true);
    expect((await api.doesCharacterHaveAchievement("Actor.char1", "ach1")).payload).toBe(true);
  });

  it("accepts a bare actor id without the Actor. prefix", async () => {
    const result = await api.awardAchievementToCharacter("ach1", "char1");
    expect(result.payload).toBe(true);
    expect((await api.doesCharacterHaveAchievement("char1", "ach1")).payload).toBe(true);
  });

  it("refuses to award twice", async () => {
    await api.awardAchievementToCharacter("ach1", "Actor.char1");
    const second = await api.awardAchievementToCharacter("ach1", "Actor.char1");
    expect(second.errorMessage).toBe("Character already has achievement.");
  });

  it("lists achievements by character", async () => {
    await api.awardAchievementToCharacter("ach1", "Actor.char1");
    const list = await api.getAchievementsByCharacter("Actor.char1");
    expect(list.payload.map((a) => a.id)).toEqual(["ach1"]);
  });

  it("removes an awarded achievement", async () => {
    await api.awardAchievementToCharacter("ach1", "Actor.char1");
    const removed = await api.removeAchievementFromCharacter("ach1", "Actor.char1");
    expect(removed.payload).toBe(true);
    expect((await api.doesCharacterHaveAchievement("Actor.char1", "ach1")).payload).toBe(false);
  });

  it("errors on unknown achievement, unknown actor, and unawarded removal", async () => {
    expect((await api.awardAchievementToCharacter("missing", "Actor.char1")).errorMessage).toBe(
      "Achievement does not exist.",
    );
    expect((await api.awardAchievementToCharacter("ach1", "Actor.missing")).errorMessage).toBe(
      "Character does not exist.",
    );
    expect((await api.removeAchievementFromCharacter("ach1", "Actor.char1")).errorMessage).toBe(
      "Character does not have achievement.",
    );
  });
});

describe("getAchievements error handling", () => {
  it("returns the error message and an empty payload on failure", async () => {
    const stored = game.settings.get("fvtt-player-achievements", "customAchievements");
    stored.push({ ...stored[0] });

    const result = await api.getAchievements();
    expect(result.errorMessage).toBe("Duplicate achievement ids found");
    expect(result.payload).toEqual([]);
  });
});
