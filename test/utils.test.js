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

import { DEFAULT_SOUND } from "../src/module/constants.js";
import {
  cleanString,
  deepCopy,
  enrichText,
  getDefaultSound,
  getFoundryVersion,
  hydrateAwardedAchievements,
  localize,
} from "../src/module/utils.js";
import { setupFoundryEnvironment } from "./setup/foundry-mocks.js";

beforeEach(() => {
  setupFoundryEnvironment();
});

describe("deepCopy", () => {
  it("returns an equal but independent object", () => {
    const original = { a: 1, nested: { b: [1, 2, 3] } };
    const copy = deepCopy(original);
    expect(copy).toEqual(original);
    copy.nested.b.push(4);
    expect(original.nested.b).toHaveLength(3);
  });
});

describe("enrichText", () => {
  it("converts formatting tokens to html tags", () => {
    expect(enrichText("{b}bold{/b} {i}italic{/i} {u}under{/u}{nl}next")).toBe(
      "<b>bold</b> <i>italic</i> <u>under</u><br>next",
    );
  });

  it("converts repeated tokens", () => {
    expect(enrichText("{b}a{/b} {b}b{/b}")).toBe("<b>a</b> <b>b</b>");
  });

  it("leaves plain text untouched", () => {
    expect(enrichText("plain text")).toBe("plain text");
  });
});

describe("cleanString", () => {
  it("escapes html-sensitive characters", () => {
    expect(cleanString('<script>alert("x") && y</script>')).toBe(
      '&lt;script&gt;alert("x") &amp;&amp; y&lt;/script&gt;',
    );
  });

  it("escapes ampersands before angle brackets so entities are not double-escaped", () => {
    expect(cleanString("&lt;")).toBe("&amp;lt;");
  });
});

describe("localize", () => {
  it("delegates to game.i18n.localize", () => {
    expect(localize("some.key")).toBe("some.key");
    expect(game.i18n.localize).toHaveBeenCalledWith("some.key");
  });
});

describe("getFoundryVersion", () => {
  it("parses major and minor from game.version", () => {
    game.version = "14.2.1";
    expect(getFoundryVersion()).toEqual({ major: 14, minor: 2 });
  });
});

describe("getDefaultSound", () => {
  it("returns the configured default sound file", () => {
    game.settings.set("fvtt-player-achievements", "defaultSoundFile", "sounds/custom.ogg");
    expect(getDefaultSound()).toBe("sounds/custom.ogg");
  });

  it("falls back to DEFAULT_SOUND when the setting is unset", () => {
    game.settings.set("fvtt-player-achievements", "defaultSoundFile", undefined);
    expect(getDefaultSound()).toBe(DEFAULT_SOUND);
  });
});

describe("hydrateAwardedAchievements", () => {
  it("attaches completed actors to matching achievements", async () => {
    await game.settings.set("fvtt-player-achievements", "customAchievements", [
      { id: "ach1", title: "First" },
      { id: "ach2", title: "Second" },
    ]);

    const hydrated = await hydrateAwardedAchievements({ ach1: ["Actor.char1"] });

    expect(hydrated).toHaveLength(2);
    expect(hydrated.find((a) => a.id === "ach1").completedActors).toEqual(["Actor.char1"]);
    expect(hydrated.find((a) => a.id === "ach2").completedActors).toEqual([]);
  });

  it("returns an empty array when no custom achievements are defined", async () => {
    await game.settings.set("fvtt-player-achievements", "customAchievements", undefined);
    expect(await hydrateAwardedAchievements({})).toEqual([]);
  });
});
