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

import { log } from "../core.js";
import { registerPF2eIntegration } from "./pf2e.js";

const SYSTEM_INTEGRATIONS = {
  pf2e: registerPF2eIntegration,
};

/**
 * Register the integration matching the active game system, if any.
 */
export function registerSystemIntegration() {
  const register = SYSTEM_INTEGRATIONS[game.system.id];
  if (register) {
    register();
    log(`Registered ${game.system.id} integration`);
  }
}
