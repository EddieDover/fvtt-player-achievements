# Player Achievements - A FoundryVTT module

This module provides GMs with a way to award players with achievements.

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FEddieDover%2Ffvtt-player-achievements%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-player-achievements&colorB=4aa94a)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffvtt-player-achievements%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/fvtt-player-achievements/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffvtt-player-achievements%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/fvtt-player-achievements/)

## Features
  ### Developers
  - Provides an API documented in [API.md](./API.md)
  ### GMs
  - Create your own achievements.
  - Assign/Unassign achievements to/from players.
  - Customize sound played per achievement.
  - Can choose to cloak all unearned achievements details from players.
  - Can choose to allow cloaked achievements to show title on a per achievement basis.
  - Can choose an image to show when an achievement is cloaked.
  - Can choose to hide all unearned achievements from players.
  - Can show achievement earn message to all players or only receiving player.
  - Can backup achievement data to clipboard as JSON.
  - Can restore achievement data from clipboard JSON text.
 ### Players
  - Optionally play a sound when an achievement is earned.
  - Control the volume of achievement sounds if they play.
 ### All
  - Sort Achievement View by achievement name (ascending or descending).
  - Sort Achievement View by owned player.
  - Filter Achievement View by name.


## Known Conflicts
| Plugin | id | Conflict |
| --- | --- | --- |
| Argon - Combat Hud | enhancedcombathud | Opens the Achievement Window after selecting target. |

## Support

Feel free to file a Bug Report / Feature Request under the Issues tab of Github.

Or you can join my **Discord** server here: https://discord.gg/XuGx7zNMKZ

## How to Use - DMs & Players

    Note: Players will see achievements that they are allowed to see based on the DMs options.
    Players will also not see the add-achievement/export/import/award/unaward/etc buttons.

### First, click the Icon on your side panel: <img src="./previews/achievementsIcon.png" title="Foundry Achievements Button"></img>

<img src="./previews/achievementScreenDMInstructions.png" title="DM Instructions for main panel" />

<img src="./previews/addAchievementScreenDMInstructions.png" title="DM Instructions for adding an Achievement" />

<img src="./previews/achievementScreenDMInstructions2.png" title="DM Instructions for awarding achievements" />


## How to Use - Developers

See [API.md](./API.md)

## Screenshots

### Achievements Icon

  <img src="./previews/achievementsIcon.png" title="Foundry Achievements Button"></img>


### Achievements Options

  <img src="./previews/achievementsOptions.png" title="Foundry Achievements Button"></img>


### Achievements Screen (GM)

  <img src="./previews/achievementScreen.png" title="Foundry Achievements Button"></img>


### Achievements Screen (Player)

  <img src="./previews/playerAchevementScreen.png" title="Foundry Achievements Button"></img>


### Achievement Message

  <img src="./previews/achievementMessage.png" title="Foundry Achievements Button"></img>


### Add Achievement Screen

  <img src="./previews/addAchievementScreen.png" title="Foundry Achievements Button"></img>

## Credits

### Sounds
  notification.ogg - [https://freesound.org/people/Rob_Marion/sounds/542043/](https://freesound.org/people/Rob_Marion/sounds/542043/)

### Images
  default.webp - [https://game-icons.net/1x1/skoll/achievement.html](https://game-icons.net/1x1/skoll/achievement.html)


### Localization

  Spanish - @maeonian
