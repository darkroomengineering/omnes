[![OMNES](https://assets.darkroom.engineering/omnes/banner.svg)](https://github.com/darkroomengineering/omnes)

[![npm](https://img.shields.io/npm/v/omnes-cli?colorA=E30613&colorB=000000)](https://www.npmjs.com/package/omnes-cli)
[![downloads](https://img.shields.io/npm/dm/omnes-cli?colorA=E30613&colorB=000000)](https://www.npmjs.com/package/omnes-cli)
[![size](https://img.shields.io/bundlephobia/minzip/omnes-cli?label=size&colorA=E30613&colorB=000000)](https://bundlephobia.com/package/omnes-cli)

<br/>

## Introduction

**Omnes** is a universal package manager CLI. One command to rule them all.

*Omnes* — Latin for "all of them."

Stop context-switching between `npm run`, `yarn`, `pnpm`, and `bun`. Omnes detects your project's package manager and proxies commands through it. Muscle memory stays intact. Workflows stay consistent.

<br/>

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Detection](#detection)
- [Commands](#commands)
- [Monorepo Support](#monorepo-support)
- [API](#api)
- [Authors](#authors)
- [License](#license)

<br/>

## Installation

```bash
npm install -g omnes-cli
```

```bash
yarn global add omnes-cli
```

```bash
pnpm add -g omnes-cli
```

```bash
bun add -g omnes-cli
```

<br/>

## Usage

```bash
omnes <command> [args...]
```

Omnes passes your command directly to the detected package manager. No configuration. No setup. It just works.

<br/>

### Quick Examples

```bash
# Install dependencies
omnes install

# Run scripts
omnes run dev
omnes run build
omnes run test

# Add packages
omnes add react
omnes add -D typescript

# Execute binaries
omnes exec vitest
omnes dlx create-next-app
```

<br/>

### Before & After

Without Omnes, you need to remember which package manager each project uses:

```bash
# Project A (uses npm)
npm install
npm run dev

# Project B (uses pnpm)
pnpm install
pnpm dev

# Project C (uses bun)
bun install
bun run dev
```

With Omnes:

```bash
# Any project
omnes install
omnes run dev
```

<br/>

## Detection

Omnes identifies the package manager by lockfile presence. Detection order matters — first match wins.

| Priority | Lockfile | Package Manager |
|----------|----------|-----------------|
| 1 | `bun.lockb` | bun |
| 2 | `bun.lock` | bun |
| 3 | `pnpm-lock.yaml` | pnpm |
| 4 | `yarn.lock` | yarn |
| 5 | `package-lock.json` | npm |

No lockfile found? Falls back to npm.

<br/>

## Commands

### Built-in Flags

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Display help message |
| `--version`, `-v` | Display version number |

<br/>

### npm Script Handling

Omnes handles npm's quirk of requiring `run` for custom scripts. Built-in npm commands work without it:

```bash
# These work as expected
omnes test        # → npm test
omnes start       # → npm start
omnes install     # → npm install

# Custom scripts automatically get 'run' prefix for npm
omnes dev         # → npm run dev (if npm detected)
omnes dev         # → bun dev (if bun detected)
```

<br/>

### npm Built-in Commands

The following commands are recognized as npm built-ins and don't receive the `run` prefix:

| Category | Commands |
|----------|----------|
| **Lifecycle** | `test`, `start`, `stop`, `restart` |
| **Dependencies** | `install`, `uninstall`, `update`, `link`, `dedupe`, `prune` |
| **Publishing** | `publish`, `pack`, `version` |
| **Info** | `ls`, `outdated`, `audit`, `view`, `search` |
| **Execution** | `exec`, `run`, `ci` |
| **Config** | `config`, `set`, `get`, `cache` |
| **Auth** | `login`, `logout`, `whoami` |
| **Other** | `init`, `doctor`, `rebuild`, `help` |

<br/>

## Monorepo Support

Omnes traverses the directory tree upward to find lockfiles. This means it works seamlessly in monorepo structures where the lockfile lives at the repository root.

```
my-monorepo/
├── pnpm-lock.yaml      ← Omnes finds this
├── packages/
│   ├── web/
│   │   └── package.json
│   └── api/
│       └── package.json  ← Running omnes here still works
```

```bash
cd my-monorepo/packages/api
omnes install  # → pnpm install (detected from root)
```

<br/>

## API

### Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success (or child process success) |
| `1` | General error |
| `127` | Package manager not found in PATH |
| `*` | Proxied from child process |

<br/>

### Output Behavior

Informational messages go to `stderr`, keeping `stdout` clean for piping:

```bash
# stderr: "Using bun: bun install"
# stdout: [actual command output]
omnes install
```

```bash
# Piping works as expected
omnes run build 2>/dev/null | head -n 10
```

<br/>

### Safe Execution

Omnes passes arguments directly to `spawn()` without shell interpolation. No command injection. No glob expansion surprises. What you type is what gets executed.

```bash
# Arguments with spaces are preserved
omnes run script "hello world"  # Passed correctly as single argument

# Special characters are safe
omnes add "package@^1.0.0"  # No shell interpretation
```

<br/>

## Troubleshooting

### Package manager not found

```
Error: 'pnpm' is not installed or not in PATH
```

Install the detected package manager or remove its lockfile to fall back to another.

<br/>

### Wrong package manager detected

If multiple lockfiles exist (common during migrations), Omnes uses the first match by priority. Remove stale lockfiles or manually specify your package manager in npm scripts.

<br/>

### Command not recognized

If a custom script isn't running with npm:

```bash
# Explicit run prefix always works
omnes run my-script

# Or add to npm built-ins recognition won't help—use run prefix
```

<br/>

## Philosophy

One command. Any project. Zero configuration.

Omnes exists because developer tooling should reduce friction, not add it. Switching between projects shouldn't require mental overhead about which package manager to use.

<br/>

## Authors

This open source project is maintained by the [darkroom.engineering](https://darkroom.engineering) team:

- Clement Roche ([@clementroche\_](https://twitter.com/clementroche_)) – [darkroom.engineering](https://darkroom.engineering)
- Guido Fier ([@uido15](https://twitter.com/uido15)) – [darkroom.engineering](https://darkroom.engineering)
- Leandro Soengas ([@lsoengas](https://twitter.com/lsoengas)) – [darkroom.engineering](https://darkroom.engineering)
- Franco Arza ([@arzafran](https://twitter.com/arzafran)) – [darkroom.engineering](https://darkroom.engineering)

<br/>

## License

[The MIT License.](https://opensource.org/licenses/MIT)
