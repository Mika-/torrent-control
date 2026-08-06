# upath v3

**The battle-tested path library that just works -- everywhere.**

[![npm version](https://img.shields.io/npm/v/upath.svg)](https://www.npmjs.com/package/upath)
[![npm downloads](https://img.shields.io/npm/dw/upath.svg)](https://www.npmjs.com/package/upath)
[![CI](https://img.shields.io/github/actions/workflow/status/anodynos/upath/ci.yml?branch=master&label=CI)](https://github.com/anodynos/upath/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/node/v/upath.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/upath)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/upath)](https://bundlephobia.com/package/upath)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/anodynos?label=Sponsors)](https://github.com/sponsors/anodynos)

A drop-in replacement for Node.js `path` that normalizes all backslashes to forward slashes, adds safe path manipulation and file extension utilities, and stays in sync with every Node.js release automatically.

Trusted for over a decade. **20 million downloads per week.** Zero runtime dependencies. 100% tested against NodeJS's own path tests. One import and every path in your project is consistent -- no more `\` vs `/` headaches across Windows, Linux, and macOS.

```typescript
import upath from 'upath' // use exactly like path — but it always works
```

## The Problem

Node.js `path` is platform-dependent. Run the same code on Windows and you get `\` separators that break everything:

```typescript
// On Windows, path gives you this:
path.normalize('c:\\windows\\..\\nodejs\\path') // 'c:\\nodejs\\path'    ← backslashes everywhere
path.join('some/nodejs\\windows', '../path') // 'some/path'           ← WRONG result
path.parse('c:\\Windows\\dir\\file.ext') // { dir: '', base: 'c:\\Windows\\dir\\file.ext' } ← BROKEN

// upath gives you this — on ALL platforms:
upath.normalize('c:\\windows\\..\\nodejs\\path') // 'c:/nodejs/path'      ✓
upath.join('some/nodejs\\windows', '../path') // 'some/nodejs/path'    ✓
upath.parse('c:\\Windows\\dir\\file.ext') // { dir: 'c:/Windows/dir', base: 'file.ext' }  ✓
```

The irony? Windows works perfectly fine with forward slashes inside Node.js. The `\` convention is purely cosmetic -- and it breaks everything downstream: path comparisons, URLs, template literals, config files, CI pipelines, globs.

**upath fixes this.** It wraps every `path` function to normalize `\` to `/` in all results. Same API, same behavior, zero surprises.

## How It Works

upath is a **thin dynamic proxy** over Node's built-in `path` module. Zero runtime dependencies -- its only import is `node:path` itself.

1. At load time, iterates over every export of `path` via `Object.entries()`
2. Functions get wrapped: string arguments are normalized on the way in, string results on the way out
3. Non-function properties are copied as-is (except `sep`, which is forced to `'/'`)
4. New `path` functions added in future Node versions are **automatically wrapped** -- no code changes needed

This means upath is always in sync with your Node.js version. It adds nothing, removes nothing -- just normalizes. Its test suite includes 421 tests, with test vectors extracted directly from [Node.js's own `path` test suite](https://github.com/nodejs/node/tree/main/test/parallel/) to verify identical behavior.

## Installation

```bash
npm install upath
```

## Usage

```typescript
// ESM
import upath from 'upath'
// or import specific functions
import { normalize, joinSafe, addExt } from 'upath'

// CJS
const upath = require('upath')
```

## API

upath proxies **all** functions and properties from Node.js `path` (`basename`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `toNamespacedPath`, `matchesGlob`), converting any `\` in results to `/`.

Additionally, `upath.sep` is always `'/'` and `upath.VERSION` provides the package version string.

### Proxied functions -- `path` vs `upath`

Every `path` function works the same, but with `\` → `/` normalization. Here's where it matters:

#### `upath.normalize(path)`

```
upath.normalize('c:\\windows\\nodejs\\path')     ✓ 'c:/windows/nodejs/path'
                                 path.normalize → 'c:\\windows\\nodejs\\path'

upath.normalize('/windows\\unix/mixed')          ✓ '/windows/unix/mixed'
                                 path.normalize → '/windows\\unix/mixed'

upath.normalize('\\windows\\..\\unix/mixed/')    ✓ '/unix/mixed/'
                                 path.normalize → '\\windows\\..\\unix/mixed/'
```

#### `upath.join(paths...)`

```
upath.join('some/nodejs\\windows', '../path')    ✓ 'some/nodejs/path'
                                     path.join → 'some/path'              ← WRONG

upath.join('some\\windows\\only', '..\\path')    ✓ 'some/windows/path'
                                     path.join → 'some\\windows\\only/..\\path'  ← BROKEN
```

#### `upath.parse(path)`

```
upath.parse('c:\\Windows\\dir\\file.ext')
  ✓ { root: '', dir: 'c:/Windows/dir', base: 'file.ext', ext: '.ext', name: 'file' }

path.parse('c:\\Windows\\dir\\file.ext')
  ✗ { root: '', dir: '', base: 'c:\\Windows\\dir\\file.ext', ext: '.ext', name: 'c:\\Windows\\dir\\file' }
```

### Extra functions

These solve real pain points that `path` ignores entirely. See [`docs/API.md`](docs/API.md) for full input/output tables.

#### `upath.toUnix(path)`

Converts all `\` to `/` and consolidates duplicate slashes, without performing any normalization.

```typescript
upath.toUnix('.//windows\\//unix//mixed////') // './windows/unix/mixed/'
upath.toUnix('\\\\server\\share') // '//server/share'
upath.toUnix('C:\\Users\\test') // 'C:/Users/test'
```

#### `upath.normalizeSafe(path)`

**The pain:** `path.normalize()` silently strips leading `./` from relative paths and `//` from UNC paths. Your `./src/index.ts` becomes `src/index.ts`, breaking ESM imports, webpack configs, and anything that depends on the explicit relative prefix.

`normalizeSafe` normalizes the path but **preserves meaningful leading `./` and `//`**:

```
upath.normalizeSafe('./dep')                 ✓ './dep'
                             path.normalize → 'dep'                      ← lost ./

upath.normalizeSafe('./path/../dep')         ✓ './dep'
                             path.normalize → 'dep'                      ← lost ./

upath.normalizeSafe('//server/share/file')   ✓ '//server/share/file'
                             path.normalize → '/server/share/file'       ← lost / (broken UNC)

upath.normalizeSafe('//./c:/temp/file')      ✓ '//./c:/temp/file'
                             path.normalize → '/c:/temp/file'            ← lost //. (broken UNC)
```

#### `upath.normalizeTrim(path)`

**The pain:** Normalized paths often end with `/` -- which breaks string comparisons and some file-system APIs. `'./src/' !== './src'` even though they're the same directory.

Like `normalizeSafe()`, but also trims any trailing `/`:

```typescript
upath.normalizeTrim('./../dep/') // '../dep'
upath.normalizeTrim('.//windows\\unix/mixed/') // './windows/unix/mixed'
```

#### `upath.joinSafe([path1][, path2][, ...])`

**The pain:** `path.join()` has the same `./` and `//` stripping problem as `path.normalize()`. Your `'./config'` becomes `'config'` after joining, silently breaking the relative import semantics you needed.

`joinSafe` works like `path.join()` but preserves leading `./` and `//`:

```
upath.joinSafe('./some/local/unix/', '../path')   ✓ './some/local/path'
                                      path.join → 'some/local/path'      ← lost ./

upath.joinSafe('//server/share/file', '../path')  ✓ '//server/share/path'
                                      path.join → '/server/share/path'   ← lost / (broken UNC)
```

#### `upath.addExt(filename, [ext])`

**The pain:** `if (!file.endsWith('.js')) file += '.js'` scattered across your codebase -- and it still has the bug where `file.json` doesn't get `.js` appended but `file.cjs` does.

Adds `.ext` to `filename`, but only if it doesn't already have the exact extension:

```typescript
upath.addExt('myfile', '.js') // 'myfile.js'
upath.addExt('myfile.js', '.js') // 'myfile.js' (unchanged — already has it)
upath.addExt('myfile.txt', '.js') // 'myfile.txt.js'
```

#### `upath.trimExt(filename, [ignoreExts], [maxSize=7])`

**The pain:** `path` has no function to strip an extension while keeping the directory. `path.basename(f, ext)` loses the directory. And what counts as an "extension" when your file is `app.config.local.js`?

Trims the extension from a filename. Extensions longer than `maxSize` chars (including the dot) are not considered valid. Extensions in `ignoreExts` are not trimmed:

```typescript
upath.trimExt('my/file.min.js') // 'my/file.min'
upath.trimExt('my/file.min', ['min'], 8) // 'my/file.min' (.min ignored)
upath.trimExt('../my/file.longExt') // '../my/file.longExt' (too long, not an ext)
```

#### `upath.removeExt(filename, ext)`

**The pain:** `path.basename('file.json', '.js')` turns `'file.json'` into `'file.json'`? Actually no -- it turns `'file.js'` into `'file'` but it also corrupts `'file.json'` into... wait, it depends on the platform. Just use `removeExt`.

Removes the specific `ext` from `filename`, if present -- and _only_ that exact extension:

```typescript
upath.removeExt('file.js', '.js') // 'file'
upath.removeExt('file.txt', '.js') // 'file.txt' (unchanged — different ext)
```

#### `upath.changeExt(filename, [ext], [ignoreExts], [maxSize=7])`

**The pain:** Changing `.coffee` to `.js` means trimming the old extension and adding the new one -- with edge cases around dotfiles, multi-segment extensions, and files with no extension at all. Every hand-rolled version of this has bugs.

Changes a filename's extension to `ext`. If it has no valid extension, the new extension is added. Extensions in `ignoreExts` are not replaced:

```typescript
upath.changeExt('module.coffee', '.js') // 'module.js'
upath.changeExt('my/module', '.js') // 'my/module.js'  (had no ext, adds it)
upath.changeExt('file.min', '.js', ['min'], 8) // 'file.min.js'   (.min ignored)
```

#### `upath.defaultExt(filename, [ext], [ignoreExts], [maxSize=7])`

**The pain:** You want to ensure a file has an extension, but only if it doesn't already have one. And you need control over what counts as "already having one" -- is `.min` an extension or part of the name?

Adds `.ext` only if the filename doesn't already have any valid extension. Extensions in `ignoreExts` are treated as if absent:

```typescript
upath.defaultExt('file', '.js') // 'file.js'
upath.defaultExt('file.ts', '.js') // 'file.ts' (already has extension)
upath.defaultExt('file.min', '.js', ['min'], 8) // 'file.min.js' (.min ignored)
```

**Note:** In all extension functions, you can use both `.ext` and `ext` -- the leading dot is always handled correctly.

## Who Uses upath

upath is a foundational dependency in the Node.js ecosystem, trusted by **1,300+ packages** on npm including:

- [**Chokidar**](https://github.com/paulmillr/chokidar) -- the file watcher behind Webpack, Vite, Rollup, and most dev servers
- [**Nuxt**](https://github.com/nuxt/nuxt) -- the Vue.js framework (v2)
- [**ansi-colors**](https://github.com/doowb/ansi-colors) -- terminal color styling
- Countless Webpack plugins, build tools, and CLI frameworks

If you run `npm ls upath` in a non-trivial Node.js project, there's a good chance it's already there.

## What's New in v3

- **TypeScript rewrite** -- full type safety, source-of-truth types shipped with the package. Compatible with `@types/node` v20 through v25+.
- **Dual CJS/ESM** -- works with `import` and `require()` out of the box via package.json `exports`.
- **Node >= 20** -- drops legacy Node support.
- **Auto-generated API docs** -- see [`docs/API.md`](docs/API.md) for complete input/output tables generated from the test suite.
- **UNC path support** -- carried forward from v2, with comprehensive test coverage.

## Migrating from v2

- **Node >= 20 required** -- v2 supported Node >= 4. Update your CI matrix.
- **CJS usage unchanged** -- `const upath = require('upath')` works as before. All functions are available directly on the module (no `.default` needed).
- **TypeScript: stricter params** -- `join()`, `resolve()`, and `joinSafe()` params narrowed from `any[]` to `string[]`. Add explicit casts if you pass non-string args: `join(myVar as string)`.
- **`_makeLong` removed** -- use `toNamespacedPath` instead (available since Node 8.3).
- **Named ESM imports now available** -- `import { normalize, join, toUnix } from 'upath'` works in addition to the default import.
- **Boxed `String` objects rejected** -- `new String('foo')` no longer accepted; use plain string primitives.

See [CHANGELOG.md](CHANGELOG.md) for the full list of changes.

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/anodynos/upath).

```bash
git clone https://github.com/anodynos/upath.git
cd upath
npm install
npm test               # 421 tests
npm run test:integration  # CJS/ESM integration tests
```

## Sponsor

upath has been free and MIT-licensed for over a decade. If it saves you time or your company depends on it, please consider sponsoring its continued maintenance:

- [GitHub Sponsors](https://github.com/sponsors/anodynos) -- recurring or one-time
- [Polar](https://polar.sh/anodynos) -- commercial-friendly, issue bounties
- [Tidelift](https://tidelift.com/subscription/pkg/npm-upath) -- enterprise supply-chain support

Running `npm fund` in your project will also show you if upath is in your tree.

## Security contact information

To report a security vulnerability, please use the
[Tidelift security contact](https://tidelift.com/security).
Tidelift will coordinate the fix and disclosure.

## License

[MIT](LICENSE) -- Copyright (c) 2014-2026 [Angelos Pikoulas](https://github.com/anodynos)
