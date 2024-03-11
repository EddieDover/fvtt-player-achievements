
## [1.3.0](https://github.com/EddieDover/fvtt-player-achievements/compare/v1.2.3...v1.3.0) (2024-03-11)


### Features

* added support for awarding achievements to offline players ([c151dcc](https://github.com/EddieDover/fvtt-player-achievements/commit/c151dcc4210f6e609f38ed3bee2fd106756ef378)), closes [#45](https://github.com/EddieDover/fvtt-player-achievements/issues/45)
* achievements may now contain newlines , bold, and italics by using special markup. See documentation. ([f022ab1](https://github.com/EddieDover/fvtt-player-achievements/commit/f022ab1537e9939f7573f73be7c93c2c6c14cecd))
* added custom tags support ([caad360](https://github.com/EddieDover/fvtt-player-achievements/commit/caad360153c9443e03c7415e8e9bffb3376f6524))


### Bug Fixes

* fixed alphabetical asc/desc sorting ([e57a59f](https://github.com/EddieDover/fvtt-player-achievements/commit/e57a59f6b23117a467d2d8791ad2753ebe81e219))

#### 1.2.3 (2024-02-18)

##### Bug Fixes

*  custom sounds were not working after API update ([b4153ba2](https://github.com/EddieDover/fvtt-player-achievements/commit/b4153ba2a0484a71bba79311f00032daca444c63))

## 1.2.2 (2024-02-08)

##### Bug Fixes

*  adjusted achievement block color to be more flexible when using theme overrides ([#43](https://github.com/EddieDover/fvtt-player-achievements/pull/43)) ([cbb67cb2](https://github.com/EddieDover/fvtt-player-achievements/commit/cbb67cb2afc14fb777b3bcbee410c7a2917009c3))

## 1.2.1 (2024-02-04)

##### Bug Fixes

*  added socketlib as a dependency ([f68aa849](https://github.com/EddieDover/fvtt-player-achievements/commit/f68aa84973878bd2aec4d120ef5bb8b0fcf56f29))
*  players who have not selected a character are now able to see the achievements window ([f3b36414](https://github.com/EddieDover/fvtt-player-achievements/commit/f3b364146a84528c7c133483c2a5c06f64f63b36))

## 1.2.0 (2024-01-29)

##### New Features

*  Translated into Brazilian Portuguese, credits to Daniel Norberto ([f6293dc3](https://github.com/EddieDover/fvtt-player-achievements/commit/f6293dc3c09123311797f3cfb80556c6bb48598f))
*  Added award/unward hooks. ([7d5c7edb](https://github.com/EddieDover/fvtt-player-achievements/commit/7d5c7edbaba7d5991cbe51a08a0a9c914a593173))
*  Added API for external access to the plugin ([adb681dc](https://github.com/EddieDover/fvtt-player-achievements/commit/adb681dcaba3fad8331372729f80a8387ec4245e))

## 1.1.0 (2023-12-04)

#### New Features

*  Added the ability to assign/unassign an achievement to all players who have/don't have it. ([1427fbc4](https://github.com/EddieDover/fvtt-player-achievements/commit/1427fbc4b1304143e3211d9bfcd70179cfbed0e3))
*  Moved all buttons to top  and cleaned up interface. ([bf938071](https://github.com/EddieDover/fvtt-player-achievements/commit/bf9380712c43c32bdb993df8b2ab1609dda463ed))
*  Added the ability to lock achievements from being edited/deleted. ([8a67f584](https://github.com/EddieDover/fvtt-player-achievements/commit/8a67f584cc8d4b73506098ce685c2669dfc19e79))
*  Added confirmation when deleting achievements ([1dc41c7d](https://github.com/EddieDover/fvtt-player-achievements/commit/1dc41c7dd2c0af110d18bf55599e6988322a9a53))
*  Achievement details can be hidden to minimize clutter while viewing the achievements list. ([87781d71](https://github.com/EddieDover/fvtt-player-achievements/commit/87781d71f907b547ab00f1003dbfd884a55b2d4e))

#### Bug Fixes

*  Fixed primary button class. This will fix Minimal-UI issues. ([b0a9f785](https://github.com/EddieDover/fvtt-player-achievements/commit/b0a9f7855129a492c523127aa2846e249e12c3c5))
*  Increased the default player achievement volume from 0.1 to 0.5 ([fd12449f](https://github.com/EddieDover/fvtt-player-achievements/commit/fd12449f84e34a3870bef5c4ed0b541d1c61d311))

## 1.0.6 (2023-11-23)

##### New Features

*  Added Discord button to primary window. ([c70d358c](https://github.com/EddieDover/fvtt-player-achievements/commit/c70d358cf41c2dee3c88348210cad1c394b9f2ae))

## 1.0.5 (2023-11-23)

#### Bug Fixes

*  Fixed achievement unlock image breaking if URL was used. ([adca8f24](https://github.com/EddieDover/fvtt-player-achievements/commit/adca8f24def6896a52cbf443fa42fe6ba0c14879)) - Report & Diagnosis Credit to @SoulCookie

## 1.0.4 (2023-11-18)

#### New Features

*  Achievements can now have a separate image when they are cloaked. ([9a043f34](https://github.com/EddieDover/fvtt-player-achievements/commit/9a043f349a726120c192e210fb03231185d8dcc0))
*  You can now choose to show the title of an achievement if it is cloaked, on a per-achievement basis. ([1ed80bdb](https://github.com/EddieDover/fvtt-player-achievements/commit/1ed80bdbd1122523d4deb06501d4d1735b155e4a))

## 1.0.3 (2023-11-11)

#### New Features

*  Added dialogs for achievement import/export for better browser compatibility. ([fd1a1a1c](https://github.com/EddieDover/fvtt-player-achievements/commit/fd1a1a1caf9af3ff49f4810bb8d7b5ebfc47f55a))

## 1.0.2 (2023-11-04)

#### Chores

*  Added conflict note with enchancedcombathud ([ff2f69c3](https://github.com/EddieDover/fvtt-player-achievements/commit/ff2f69c3a190cdc84f05b63f0a7994d2a4df984f))
*  improved localization ([48c1f174](https://github.com/EddieDover/fvtt-player-achievements/commit/48c1f174da980448b25eaf08953c30297e4cc130))

#### New Features

*  Added bug report & feedback buttons to achievements window ([7abe91ce](https://github.com/EddieDover/fvtt-player-achievements/commit/7abe91ce238eac5e948ff42e764940fd36e1b174))

## 1.0.1 (2023-10-25)

#### Bug Fixes

*  corrected message display on achievement creation ([a03b3f68](https://github.com/EddieDover/fvtt-player-achievements/commit/a03b3f68ef57d84d5f096bffba48c2c979214039))

## 1.0.0 (2023-10-23)

Initial Release
