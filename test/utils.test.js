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

import { cleanString, deepCopy, enrichText, hydrateAwardedAchievements, localize } from "../src/module/utils";
import { jest } from "@jest/globals";

beforeEach(() => {
  global.game = {
    settings: {
      get: jest.fn((first_key, second_key) => {
        if (first_key === "fvtt-player-achievements") {
          if (second_key === "customAchievements") {
            return [{ id: "1", name: "test-achievement" }];
          } else if (second_key === "awardedAchievements") {
            return { 1: ["actor1", "actor2"] };
          }
        }
      }),
    },
    i18n: {
      localize: jest.fn((x) => x).mockReturnValue("localized string"),
    },
  };
});

describe("Enriches text test", () => {
  it("will enrich text", () => {
    const text = "This is a {b}bold{/b} statement.";
    const enrichedText = enrichText(text);
    expect(enrichedText).toEqual("This is a <b>bold</b> statement.");
  });
});

describe("Tests Deep Copy", () => {
  it("will deep copy an object", () => {
    const object = { a: 1, b: 2, c: 3 };
    const deepCopiedObject = deepCopy(object);
    expect(deepCopiedObject).toEqual(object);
  });
});

describe("String Sanitization", () => {
  it("will clean a string", () => {
    const text = "This is a <b>bold</b> statement.";
    const cleanedText = cleanString(text);
    expect(cleanedText).toEqual("This is a &lt;b&gt;bold&lt;/b&gt; statement.");
  });
});

describe("Achievement Hydration", () => {
  it("will hydrate achievements", async () => {
    const awardedAchievements = { 1: ["actor1", "actor2"] };
    const hydratedAchievements = await hydrateAwardedAchievements(awardedAchievements);
    expect(hydratedAchievements).toEqual([
      { id: "1", name: "test-achievement", completedActors: ["actor1", "actor2"] },
    ]);
  });
});

describe("Tests Localization", () => {
  it("will localize a string", () => {
    const localizedString = localize("test-string");
    expect(localizedString).toEqual("localized string");
  });
});
