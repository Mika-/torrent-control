# addons-scanner-utils

[![CircleCI](https://circleci.com/gh/mozilla/addons-scanner-utils.svg?style=svg)](https://circleci.com/gh/mozilla/addons-scanner-utils) [![codecov](https://codecov.io/gh/mozilla/addons-scanner-utils/branch/master/graph/badge.svg)](https://codecov.io/gh/mozilla/addons-scanner-utils) [![npm version](https://badge.fury.io/js/addons-scanner-utils.svg)](https://badge.fury.io/js/addons-scanner-utils)

Various addons related helpers to build scanners.

## Usage

```
npm install addons-scanner-utils
```

## Requirements

- You need [Node](https://nodejs.org/) 22, which is the current [LTS](https://github.com/nodejs/LTS) (long term support) release.
- You need [npm](https://www.npmjs.com/) to manage dependencies and run commands.

## Development

- Read [our contributing guidelines](./CONTRIBUTING.md) to get started on your first patch
- Clone this repository
- Type `npm install` to install everything
- Run the test suite to make sure everything is set up: `npm test`

### Available development commands

In the project directory, you can run the following commands. There are a few commands not mentioned here (see `package.json`) but those are only used by internal processes.

#### `npm run eslint`

This runs [ESLint][] to discover problems within our codebase without executing it. ESLint also enforces some patterns and practices.

#### `npm run lint`

This runs all the _lint_ commands at once.

#### `npm run prettier`

This runs [Prettier][] to automatically format the entire codebase.

#### `npm run prettier-dev`

This runs [Prettier][] on only your changed files. This is intended for development.

#### `npm test`

This launches [Jest][] in the interactive watch mode.

### Prettier

We use [Prettier][] to automatically format our JavaScript code and stop all the on-going debates over styles. As a developer, you have to run it (with `npm run prettier-dev`) before submitting a Pull Request.

### Versioning

This project follows the [semantic versioning](https://semver.org/) specification.

In order to release a new version, one has to run the [`npm version`](https://docs.npmjs.com/cli/version) command with one of the following arguments: `minor`, `patch` or `major` (less frequent). This command (1) updates the `version` in `package.json`, (2) create a new commit for the release and (3) make a `git` tag.

[eslint]: https://eslint.org/
[jest]: https://jestjs.io/
[prettier]: https://prettier.io/
