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
 * Minimal mocks of the Foundry VTT globals used by this module.
 * Call `setupFoundryEnvironment()` in beforeEach to get a fresh world.
 */

/** Simple in-memory replacement for game.settings backed by a Map. */
class MockSettings {
  constructor() {
    this.store = new Map();
  }

  key(namespace, key) {
    return `${namespace}.${key}`;
  }

  get(namespace, key) {
    return this.store.get(this.key(namespace, key));
  }

  set(namespace, key, value) {
    this.store.set(this.key(namespace, key), value);
    return Promise.resolve(value);
  }

  register() {}
}

/**
 * Create a mock user.
 * @param {object} overrides Property overrides
 * @param {string} overrides.id User id
 * @param {string} overrides.name User name
 * @param {boolean} overrides.isGM Is the user a GM?
 * @param {boolean} overrides.active Is the user logged in?
 * @param {object} overrides.character The user's assigned character
 * @returns {object} A user object
 */
export function createMockUser({ id = "user1", name = "Player One", isGM = false, active = true, character } = {}) {
  return { id, _id: id, name, isGM, active, character };
}

/**
 * Create a mock character/actor.
 * @param {object} overrides Property overrides
 * @param {string} overrides.id Actor id
 * @param {string} overrides.name Actor name
 * @param {string} overrides.type Actor type ("character", "npc", ...)
 * @returns {object} An actor object
 */
export function createMockCharacter({ id = "char1", name = "Hero", type = "character" } = {}) {
  return { id, name, type, uuid: `Actor.${id}` };
}

/** A collection that behaves enough like Foundry's Collection (Map + array helpers). */
class MockCollection extends Array {
  get(id) {
    return this.find((item) => item.id === id || item._id === id);
  }
}

/** Mock socket that records emitted events and lets tests trigger handlers. */
class MockSocket {
  constructor() {
    this.handlers = new Map();
    this.emitted = [];
  }

  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.handlers.get(event) ?? [];
    const index = handlers.indexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  }

  emit(event, data) {
    this.emitted.push({ event, data });
  }

  /**
   * Simulate an incoming socket message, as if sent from another client.
   * @param {string} event The socket event name
   * @param {object} data The message payload
   */
  async receive(event, data) {
    // Iterate a copy: handlers may unregister themselves mid-dispatch.
    const handlers = [...(this.handlers.get(event) ?? [])];
    for (const handler of handlers) {
      await handler(data);
    }
  }
}

/**
 * Build a fresh set of Foundry globals and install them on globalThis.
 * @param {object} options Options
 * @param {object} options.user The current logged-in user (defaults to a GM)
 * @param {Array} options.users All users in the world
 * @param {Array} options.actors All actors in the world
 * @returns {{game: object, socket: MockSocket, chatMessages: Array, playedSounds: Array}} handles for assertions
 */
export function setupFoundryEnvironment({ user, users = [], actors = [] } = {}) {
  const currentUser = user ?? createMockUser({ id: "gm", name: "Gamemaster", isGM: true });
  const allUsers = new MockCollection();
  allUsers.push(currentUser, ...users.filter((u) => u !== currentUser));
  const allActors = new MockCollection();
  allActors.push(...actors);

  const socket = new MockSocket();
  const settings = new MockSettings();

  // Sensible defaults for every setting the module reads.
  settings.set("fvtt-player-achievements", "customAchievements", []);
  settings.set("fvtt-player-achievements", "awardedAchievements", {});
  settings.set("fvtt-player-achievements", "pendingAwardedAchievements", {});
  settings.set("fvtt-player-achievements", "hideUnearnedAchievements", false);
  settings.set("fvtt-player-achievements", "cloakUnearnedAchievements", false);
  settings.set("fvtt-player-achievements", "showTagsToPlayers", true);
  settings.set("fvtt-player-achievements", "showOnlyToAwardedUser", false);
  settings.set("fvtt-player-achievements", "cloakTitleText", "HIDDEN");
  settings.set("fvtt-player-achievements", "cloakDescriptionText", "HIDDEN");
  settings.set(
    "fvtt-player-achievements",
    "defaultSoundFile",
    "/modules/fvtt-player-achievements/sounds/notification.ogg",
  );
  settings.set("core", "globalInterfaceVolume", 0.5);

  const game = {
    version: "14.0.0",
    user: currentUser,
    users: allUsers,
    actors: allActors,
    socket,
    settings,
    i18n: {
      localize: jest.fn((key) => key),
      format: jest.fn((key, data) => `${key}:${JSON.stringify(data)}`),
    },
  };

  const chatMessages = [];
  const ChatMessage = {
    getSpeaker: jest.fn(({ alias } = {}) => ({ alias })),
    create: jest.fn((chatData) => {
      chatMessages.push(chatData);
      return Promise.resolve(chatData);
    }),
  };

  const playedSounds = [];
  class MockAudio {
    constructor(source) {
      this.src = source;
      this.volume = 1;
    }

    play() {
      playedSounds.push({ src: this.src, volume: this.volume });
      return Promise.resolve();
    }
  }

  const Hooks = {
    call: jest.fn(),
    callAll: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  };

  globalThis.game = game;
  globalThis.ChatMessage = ChatMessage;
  globalThis.Audio = MockAudio;
  globalThis.Hooks = Hooks;

  return { game, socket, chatMessages, playedSounds, Hooks, ChatMessage };
}
