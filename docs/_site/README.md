# Player Achievements - A FoundryVTT module

This module provides GMs with a way to award players with achievements.

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FEddieDover%2Ffvtt-player-achievements%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-player-achievements&colorB=4aa94a)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffvtt-player-achievements%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/fvtt-player-achievements/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffvtt-player-achievements%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/fvtt-player-achievements/)

## Links

| Upcoming Changes | API Documentation |
| --- | --- |
| [Link](UPCOMING_CHANGELOG.md) | [Link](API.md) |

## Features

### Developers

- Provides an API documented in [API.md](./API.md)
- Provides hooks for after achievement award/unaward.

### GMs

- Create your own achievements.
- Add tags to achievements for easier display filtering.
- Choose to show or hide tags when players view achievements.
- Assign/Unassign achievements to/from players.
- Award achievements to players that are offline and they will recieve them when they next login.
- Customize sound played per achievement.
- Choose to cloak all unearned achievements details from players.
- Choose to allow cloaked achievements to show title on a per achievement basis.
- Choose an image to show when an achievement is cloaked.
- Choose to hide all unearned achievements from players.
- Show achievement earn message to all players or only receiving player.
- Backup achievement data to clipboard as JSON.
- Restore achievement data from clipboard JSON text.
- Use special markup to include newlines, bold, and italic text in descriptions of achievements.

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

## How to Use - DMs & Players

    Note: Players will see achievements that they are allowed to see based on the DMs options.
    Players will also not see the add-achievement/export/import/award/unaward/etc buttons.

### First, click the Icon on your side panel: <img src="./previews/achievementsIcon.png" title="Foundry Achievements Button"/>

<img src="./previews/achievementScreenDMInstructions.png" title="DM Instructions for main panel" />

<img src="./previews/addAchievementScreenDMInstructions.png" title="DM Instructions for adding an Achievement" />

<img src="./previews/achievementScreenDMInstructions2.png" title="DM Instructions for awarding achievements" />

### Markup

The following tags are supported in the Achievement Description:

- {nl} - Inserts a line break
- {b}{/b} - Contents will be <b>bold</b>
- {i}{/i} - Contents will be <i>italics</i>
- {u}{/u} - Contents will be <u>underlined</u>

## How to Use - Developers

### Hooks for Achievement Events

The module provides two hooks, "**fvtt-player-achievements.awardAchievement**" and "**fvtt-player-achievements.unAwardAchievement**", allowing developers to integrate custom functionality after an achievement is granted or removed to/from a character.

***Both hooks grant two parameters, the Achievement ID and the Character UUID, in that order.***

#### Example Usage:

 ```javascript
  // Triggered after an achievement is granted to a character
  Hooks.on("fvtt-player-achievements.awardAchievement", (achievementId, characterUUID) => {
    console.log(`Character ${characterUUID} has gained the achievement: ${achievementId}`);
  });
```

### API

An API is also provided that allows direct control of this module. See [API.md](./API.md)

## Screenshots

### Achievements Icon

  <img src="./previews/achievementsIcon.png" title="Foundry Achievements Button"/>

### Achievements Options

  <img src="./previews/achievementsOptions.png" title="Foundry Achievements Button"/>

### Achievements Screen (GM)

  <img src="./previews/achievementScreen.png" title="Foundry Achievements Button"/>

### Achievements Screen (Player)

  <img src="./previews/playerAchevementScreen.png" title="Foundry Achievements Button"/>

### Achievement Message

  <img src="./previews/achievementMessage.png" title="Foundry Achievements Button"/>

### Add Achievement Screen

  <img src="./previews/addAchievementScreen.png" title="Foundry Achievements Button"/>

## Credits

### Sounds

  notification.ogg - [https://freesound.org/people/Rob_Marion/sounds/542043/](https://freesound.org/people/Rob_Marion/sounds/542043/)

### Images

  default.webp - [https://game-icons.net/1x1/skoll/achievement.html](https://game-icons.net/1x1/skoll/achievement.html)

### Localization

  Spanish - @maeonian

  Brazilian Portuguese - Daniel Norberto
