# Changelog

## 3.0.7

### Patch Changes

- 7f1590a: Fix `@types/node` >= 25 compatibility. `PlatformPath` was removed from `@types/node` v25; upath now derives its `PlatformPath` type from `typeof path` instead of re-exporting the removed interface. Works with `@types/node` v20 through v25+.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [3.0.6] - 2026-04-09

### Added

- **Polar.sh funding** -- added to `.github/FUNDING.yml` and `package.json` alongside existing GitHub Sponsors and Tidelift.
- **"Who Uses upath" section** in README -- trust signals with notable dependents (Chokidar, Nuxt, 1,300+ npm packages).
- **Architecture section** in README -- explains the dynamic proxy pattern and how upath stays in sync with Node.js.

### Changed

- **README revamped** -- pain-first API docs showing `path` vs `upath` behavior side-by-side, inspired by the v2-era docs. Every extra function now explains _why_ it exists (what `path` does wrong).
- **Deterministic `docs/API.md` generation** -- test files are now sorted by name before the doc reporter processes them, eliminating spurious diffs caused by Jest's non-deterministic parallel execution order.

### Fixed

- **Pre-commit hook now works in git worktrees without `node_modules`** -- the hook falls back to the main worktree's `node_modules/.bin` when lint-staged isn't found locally.

## [3.0.1] - [3.0.5]

Patch releases for CI/CD setup (Copybara bidirectional sync, Trusted Publishing OIDC), build fixes, and internal tooling. No user-facing API changes.

## [3.0.0] - 2026-04-05

### Breaking Changes

- **Node >= 20 required** — dropped support for Node 4–18. Update your CI matrix and `engines` field.
- **CJS exports now include `__esModule` and `default` properties** — `require('upath')` still works for all standard usage (no `.default` needed). However, `Object.keys(require('upath'))` now includes `"__esModule"` and `"default"`. Bundlers using Babel-style interop (`mod.__esModule ? mod.default : mod`) will resolve to `.default`, which IS the full upath object, so it works correctly.
- **TypeScript type params narrowed** — `join(...paths: any[])` → `join(...paths: string[])`, same for `resolve` and `joinSafe`. If you pass non-string args, add explicit casts: `join(myVar as string)`.
- **`_makeLong` removed from top-level exports** — this was a deprecated Node.js internal. Use `toNamespacedPath` instead (available in upath v2+ and Node.js 8.3+). Note: `_makeLong` remains accessible via the `.default` property on CJS exports (it's part of the full `path` proxy), but this is not a supported API.
- **Boxed `String` objects no longer accepted** — `new String('foo')` is rejected; use plain string primitives. This is unlikely to affect anyone.

### Added

- **TypeScript rewrite** — full type safety, source-of-truth types shipped with the package.
- **Dual CJS/ESM** — `import` and `require()` both work via package.json `exports`.
- **Named ESM imports** — `import { normalize, join, toUnix } from 'upath'`.
- **`matchesGlob`** typed export (wraps Node 22+ `path.matchesGlob`).
- **`toNamespacedPath`** typed export.
- **`UPath` interface** exported for TypeScript consumers.
- **Auto-generated API docs** — `docs/API.md` built from test suite.

### Changed

- Source rewritten from CoffeeScript/JavaScript to TypeScript.
- Build toolchain changed to tsup (dual CJS + ESM output).
- Test framework changed to Jest with ts-jest.

[3.0.6]: https://github.com/anodynos/upath/compare/v3.0.5...v3.0.6
[3.0.0]: https://github.com/anodynos/upath/releases/tag/v3.0.0
