## Introduction

**Omnes** is a command-line interface (CLI) tool that simplifies the execution of common commands across different package managers. It automatically detects the package manager used in your project and runs the appropriate command using the detected package manager.

The name is the translation from 'all of them' to latin.

<br/>

## Installation

To install Omnes globally, use the following command:

```bash
npm install -g omnes-cli
```

Or with other package managers:

```bash
# yarn
yarn global add omnes-cli

# pnpm
pnpm add -g omnes-cli

# bun
bun add -g omnes-cli
```

## Usage

Once installed, you can use the omnes command followed by the desired command you want to run. Omnes will detect the package manager based on the presence of specific lockfiles in your project directory and execute the command accordingly.

```bash
omnes <command> [args...]
```

### CLI Options

```bash
omnes --help     # Show help message
omnes --version  # Show version number
```

### Examples

To install dependencies:

```bash
omnes install
```

To run a development server:

```bash
omnes run dev
```

To build your project:

```bash
omnes run build
```

To run tests:

```bash
omnes test
```

To add a package:

```bash
omnes add lodash
```

## Supported Package Managers

- npm
- Yarn
- pnpm
- Bun

If no lockfile is found, Omnes will default to using npm.

## Lockfile Detection

Omnes detects the package manager by looking for specific lockfiles:

| Package Manager | Lockfile |
|----------------|----------|
| Bun | `bun.lockb`, `bun.lock` |
| pnpm | `pnpm-lock.yaml` |
| npm | `package-lock.json` |
| Yarn | `yarn.lock` |

### Monorepo Support

Omnes traverses parent directories to find lockfiles, making it work seamlessly in monorepo setups where the lockfile is at the root of the repository.

## Features

- **Automatic Detection**: Detects the package manager from lockfiles
- **Monorepo Support**: Traverses parent directories to find lockfiles
- **Safe Execution**: No shell interpolation - arguments are passed directly
- **npm Script Handling**: Automatically adds "run" prefix for custom npm scripts
- **Clear Error Messages**: Helpful errors when package manager is not installed

## Authors

This open source package is maintained by the darkroom.engineering team:

- Clement Roche ([@clementroche\_](https://twitter.com/clementroche_)) - [darkroom.engineering](https://darkroom.engineering)
- Guido Fier ([@uido15](https://twitter.com/uido15)) - [darkroom.engineering](https://darkroom.engineering)
- Leandro Soengas ([@lsoengas](https://twitter.com/lsoengas)) - [darkroom.engineering](https://darkroom.engineering)
- Franco Arza ([@arzafran](https://twitter.com/arzafran)) - [darkroom.engineering](https://darkroom.engineering)

<br/>

## License

[The MIT License.](https://opensource.org/licenses/MIT)
