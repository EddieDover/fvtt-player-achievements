# API functions

Access functions via `game["fvtt-player-achievements"].api`.

All functions return the following object:

  ```javascript
  {
    errorMessage: 'Error message',
    payload: object
  }
  ```

## Current API Functions:

### getAchievements - Returns the achievements array



&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<Array.<Achievement>>"`: Achievements List

<hr/>


### doesAchievementExist - Does the achievement exist?


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `achievementId` (string): The achievement id

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Does the achievement exist?

<hr/>


### doesCharacterHaveAchievement - Does the character have the achievement?


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `characterUUID` (string): The character uuid

  &nbsp;&nbsp;&nbsp;&nbsp;  - `achievementId` (string): The achievement id

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Does the character have the achievement?

<hr/>


### awardAchievementToCharacter - Award the achievement to the character


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `achievementId` (string): The achievement id

  &nbsp;&nbsp;&nbsp;&nbsp;  - `characterUUID` (string): The character uuid

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Was the achievement awarded?

<hr/>


### getAchievementsByCharacter - Get the achievements for the character


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `characterUUID` (string): The character uuid

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<Array.<Achievement>>"`: achievements for the character

<hr/>


### createAchievement - Create an achievement


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `id` (string): The achievement id

  &nbsp;&nbsp;&nbsp;&nbsp;  - `title` (string): The achievement title

  &nbsp;&nbsp;&nbsp;&nbsp;  - `description` (string): The achievement description

  &nbsp;&nbsp;&nbsp;&nbsp;  - `showTitleCloaked` (boolean) [**Optional**]: Show the title cloaked? (Default: false)

  &nbsp;&nbsp;&nbsp;&nbsp;  - `image` (string) [**Optional**]: The achievement image (Default: &quot;/modules/fvtt-player-achievements/images/default.webp&quot;)

  &nbsp;&nbsp;&nbsp;&nbsp;  - `cloakedImage` (string) [**Optional**]: The achievement cloaked image (Default: &quot;/modules/fvtt-player-achievements/images/default.webp&quot;)

  &nbsp;&nbsp;&nbsp;&nbsp;  - `sound` (string) [**Optional**]: The achievement sound effect (Default: &quot;/modules/fvtt-player-achievements/sounds/notification.ogg&quot;)

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Was the achievement created?

<hr/>


### editAchievement - Edit an achievement


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `id` (string): The achievement id

  &nbsp;&nbsp;&nbsp;&nbsp;  - `title` (string): The achievement title

  &nbsp;&nbsp;&nbsp;&nbsp;  - `description` (string): The achievement description

  &nbsp;&nbsp;&nbsp;&nbsp;  - `showTitleCloaked` (boolean) [**Optional**]: Show the title cloaked? (Default: false)

  &nbsp;&nbsp;&nbsp;&nbsp;  - `image` (string) [**Optional**]: The achievement image (Default: &quot;/modules/fvtt-player-achievements/images/default.webp&quot;)

  &nbsp;&nbsp;&nbsp;&nbsp;  - `cloakedImage` (string) [**Optional**]: The achievement cloaked image (Default: &quot;/modules/fvtt-player-achievements/images/default.webp&quot;)

  &nbsp;&nbsp;&nbsp;&nbsp;  - `sound` (string) [**Optional**]: The achievement sound effect (Default: &quot;/modules/fvtt-player-achievements/sounds/notification.ogg&quot;)

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Was the achievement edited?

<hr/>


### removeAchievementFromCharacter - Remove an achievement from the character


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `achievementId` (string): The achievement id

  &nbsp;&nbsp;&nbsp;&nbsp;  - `characterUUID` (string): The character uuid

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Was the achievement removed?

<hr/>


### deleteAchievement - Delete an achievement


&nbsp;&nbsp;&nbsp;&nbsp; **Parameters:**

  &nbsp;&nbsp;&nbsp;&nbsp;  - `id` (string): 

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:**

&nbsp;&nbsp;&nbsp;&nbsp;  - `"PlayerAchievementReturn.<boolean>"`: Was the achievement deleted?

<hr/>

