# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.4.0](https://github.com/feryardiant/poc-brackets/compare/v0.3.0...v0.4.0) (2025-05-12)


### ⚠ BREAKING CHANGES

* `parties.js` no longer exports `MatchSided` class and
`rearrangePartiesBySide` method, use `Matchup` class and `matchmakingParties`
from `matches.js` instead

Signed-off-by: Fery Wardiyanto <ferywardiyanto@gmail.com>

### Features

* **dev:** init end-to-end tests ([#26](https://github.com/feryardiant/poc-brackets/issues/26)) ([a5a2dec](https://github.com/feryardiant/poc-brackets/commit/a5a2dec566bbb458f9a477b220830f55c7729600))
* initiate tests ([#23](https://github.com/feryardiant/poc-brackets/issues/23)) ([2b07fae](https://github.com/feryardiant/poc-brackets/commit/2b07faee8d1e2c6696997a9a198d21f10e15b473))
* make use of nesting css ([#22](https://github.com/feryardiant/poc-brackets/issues/22)) ([dda57b8](https://github.com/feryardiant/poc-brackets/commit/dda57b860f8ed6eade01e0d124e6c06a3631e05e))
* use better terms that commonly used in a tournament ([#21](https://github.com/feryardiant/poc-brackets/issues/21)) ([511ff41](https://github.com/feryardiant/poc-brackets/commit/511ff417fa36d65fa60f176b15dbfe32fb2e91a6))


### Bug Fixes

* **demo:** fix issue on upload example `.csv` file ([#25](https://github.com/feryardiant/poc-brackets/issues/25)) ([9cd48bc](https://github.com/feryardiant/poc-brackets/commit/9cd48bc92317191063fe95f5ac7e1294d62d9cae))
* fix missing type definition due to b06eff0 ([738420e](https://github.com/feryardiant/poc-brackets/commit/738420e28ea3d31391a13db902fc895297710496))


* move and rename methods ([b06eff0](https://github.com/feryardiant/poc-brackets/commit/b06eff073d201268634bba7f2819ca8dd71e628c))

## [0.3.0](https://github.com/feryardiant/poc-brackets/compare/v0.2.1...v0.3.0) (2024-12-09)


### ⚠ BREAKING CHANGES

* uses native js classes for `Round`, `Match` and `Party`
instead of just type definitions

Signed-off-by: Fery Wardiyanto <ferywardiyanto@gmail.com>
* simplify match creation method and enhance accessibilities

### Features

* add `label` property (readonly) ([67d06da](https://github.com/feryardiant/poc-brackets/commit/67d06da34e9fca551b5e053d8d988f5d3aa62d1b))
* add `label` property (readonly) on `Match` class ([c9cb0be](https://github.com/feryardiant/poc-brackets/commit/c9cb0bee2a1a817a5fb9150296d94842324d04ee))
* add ability to `knock-off` the opponent ([fe57a0c](https://github.com/feryardiant/poc-brackets/commit/fe57a0caa700ee90d34b22deae5d16f7084ca3d4)), closes [/github.com/feryardiant/poc-brackets/pull/20#issuecomment-2529495693](https://github.com/feryardiant//github.com/feryardiant/poc-brackets/pull/20/issues/issuecomment-2529495693)
* rearrange `render` method to clean up the outputs ([f190a86](https://github.com/feryardiant/poc-brackets/commit/f190a8603a2f5ef84eaf7effb5801ebee95672ca))
* refactor entire codebase ([#20](https://github.com/feryardiant/poc-brackets/issues/20)) ([adf8ce7](https://github.com/feryardiant/poc-brackets/commit/adf8ce7258769f141673b513fc586a1d664c62e6))
* simplify match creation method and enhance accessibilities ([f3d7ee0](https://github.com/feryardiant/poc-brackets/commit/f3d7ee0ab6db05d550a7123e15638f014f7d43f3))


* rewrite entire codebase ([88ebdec](https://github.com/feryardiant/poc-brackets/commit/88ebdec02c5554dbeadff4b5aca1424e0508b7ac))

### [0.2.1](https://github.com/feryardiant/poc-brackets/compare/v0.2.0...v0.2.1) (2024-12-07)


### Features

* simplify winner selection by dispatching custom event to the `` instance ([f8c1f25](https://github.com/feryardiant/poc-brackets/commit/f8c1f2584a86b247537f34a7282058702ce01d1c))

## [0.2.0](https://github.com/feryardiant/poc-brackets/compare/v0.1.1...v0.2.0) (2024-12-07)


### ⚠ BREAKING CHANGES

* `render` method second param changed into list of
registered parties
* See 351278d and 9b5a26e for detail

### Features

* **#13:** patch matchup arrangement to comply with `upper-byes` pattern ([#18](https://github.com/feryardiant/poc-brackets/issues/18)) ([f6d2673](https://github.com/feryardiant/poc-brackets/commit/f6d26732a89d8f7302a63df602ab67976a686857)), closes [#13](https://github.com/feryardiant/poc-brackets/issues/13) [#14](https://github.com/feryardiant/poc-brackets/issues/14) [#15](https://github.com/feryardiant/poc-brackets/issues/15)
* **#6:** add behavior to the radio box to select winner on each match ([#8](https://github.com/feryardiant/poc-brackets/issues/8)) ([a3476a6](https://github.com/feryardiant/poc-brackets/commit/a3476a6dc4a9a9baab3eda212e96585311b0e095)), closes [#6](https://github.com/feryardiant/poc-brackets/issues/6)
* add ability to calculate 'bye' match and move it to next round ([62f8138](https://github.com/feryardiant/poc-brackets/commit/62f813839224c0114d4e9d295a2221c5076ea5af)), closes [#15](https://github.com/feryardiant/poc-brackets/issues/15)
* add ability to replace participant name on next round ([#19](https://github.com/feryardiant/poc-brackets/issues/19)) ([88d354b](https://github.com/feryardiant/poc-brackets/commit/88d354bb94e874454120d168d690f28113e6672a)), closes [#6](https://github.com/feryardiant/poc-brackets/issues/6)
* add ability to upload `csv` file to generate chart ([#12](https://github.com/feryardiant/poc-brackets/issues/12)) ([0c71dc1](https://github.com/feryardiant/poc-brackets/commit/0c71dc1d0004d7948f51d7e2a3290d1f6a93bb2a))
* add new `determineNextRoundFromPrevMatches` method ([6ece748](https://github.com/feryardiant/poc-brackets/commit/6ece7481e7dd3fca8b0dfd57a5a549fce0a91ccb))
* **dev:** add type definition to improve dx ([d181314](https://github.com/feryardiant/poc-brackets/commit/d1813142bc0f9e48d0128e4bcbd1b096f4858c80))
* **dev:** configure automation for pull-requests ([#4](https://github.com/feryardiant/poc-brackets/issues/4)) ([e042dbb](https://github.com/feryardiant/poc-brackets/commit/e042dbb1a3006bc243e2bac52b0cc4656da1735f))
* **dev:** ignore `bun` and `deno` lock file ([5a18f13](https://github.com/feryardiant/poc-brackets/commit/5a18f13eb4e81af0a15c224035ba4582cf8dbf93))
* **dev:** split labeling job into separated workflow with `pull_request_target` ([9583bd0](https://github.com/feryardiant/poc-brackets/commit/9583bd05dcdeced4991f72d0d07a37c4507d48ee))
* refactor `generateRounds` and `generateParties` method signature ([#11](https://github.com/feryardiant/poc-brackets/issues/11)) ([1decbe1](https://github.com/feryardiant/poc-brackets/commit/1decbe14aa406067e72e2cca60a36273bb571920))
* simplify the logic of registering parties based on matches in prior round ([6f8154d](https://github.com/feryardiant/poc-brackets/commit/6f8154ddb0f38569e421ca8357d109e11d2f1f41))
* use specific numeric font-variant and make slider width fixed ([e0ef778](https://github.com/feryardiant/poc-brackets/commit/e0ef778f14af663f4d769b8b26127c614df0d2f2))


### Bug Fixes

* **#5:** fix match position ([#10](https://github.com/feryardiant/poc-brackets/issues/10)) ([0b26e71](https://github.com/feryardiant/poc-brackets/commit/0b26e71a022f79b4b8b6631db9f9b939a2d4115b))
* fix issue caused by prior commit ([a466bf9](https://github.com/feryardiant/poc-brackets/commit/a466bf9a603676fa1dd88d2a657db7677bae52db))
* fix match `size` and `span` mechanic ([a9f6bf3](https://github.com/feryardiant/poc-brackets/commit/a9f6bf3d68e3987588411af312ebf4c69fafc5c6))
* generation of `match.id` on `singular` match ([d021ccf](https://github.com/feryardiant/poc-brackets/commit/d021ccfb8679e2e953d05c666247fd8c98119f55)), closes [#14](https://github.com/feryardiant/poc-brackets/issues/14)
* rearrange matches structure and layouts ([#7](https://github.com/feryardiant/poc-brackets/issues/7)) ([215e2a2](https://github.com/feryardiant/poc-brackets/commit/215e2a2c5be5946bf2bc441a1eafe586bd4d338a))
* remove console.log and fix linting issues ([67ff868](https://github.com/feryardiant/poc-brackets/commit/67ff8686396b19270c57bef4e2d7721b58d5bb1e))

### [0.1.1](https://github.com/feryardiant/poc-brackets/compare/v0.1.0...v0.1.1) (2024-11-13)


### Features

* add `title` attribute on the participant name ([cec89e8](https://github.com/feryardiant/poc-brackets/commit/cec89e8d3226c94637f4bc900080892b0cfcb847))
* add release automation and dependency updates via github actions ([#3](https://github.com/feryardiant/poc-brackets/issues/3)) ([9ec24c9](https://github.com/feryardiant/poc-brackets/commit/9ec24c9726a7968596908f9badad172cf7d5afdb))


### Bug Fixes

* **#1:** fix layout structur ([#2](https://github.com/feryardiant/poc-brackets/issues/2)) ([b98d989](https://github.com/feryardiant/poc-brackets/commit/b98d989cf44eceee3dfc136d8829ec2e8ff7318f))
* fix missing the actual release automation on the [#3](https://github.com/feryardiant/poc-brackets/issues/3) :facepalm: ([a25fd51](https://github.com/feryardiant/poc-brackets/commit/a25fd51b8c535fff656b41e46437c1f15992d637))

## 0.1.0 (2024-11-13)


### Features

* add `release` script ([0bd053d](https://github.com/feryardiant/poc-brackets/commit/0bd053df183d55368d4bcccd78099a8d3e2907e9))


### Bug Fixes

* round 0 to 1 match bracket ([f7f1c3f](https://github.com/feryardiant/poc-brackets/commit/f7f1c3f9f888e805218a1cc411b8d2b0acee9495))
