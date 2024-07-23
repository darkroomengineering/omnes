## Introduction

**Omnes** is a command-line interface (CLI) tool that simplifies the execution of common commands across different package managers. It automatically detects the package manager used in your project and runs the appropriate command using the detected package manager.

The name is the translation from 'all of them' to latin.

<br/>

## Installation

To install Omnes globally, use the following command:

```bash
npm install -g omnes-cli
```

## Usage

Once installed, you can use the omnes command followed by the desired command you want to run. Omnes will detect the package manager based on the presence of specific lockfiles in your project directory and execute the command accordingly.

```bash
omnes <command>
```

### For example:

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

## Omnes supports the following package managers:

- npm
- Yarn
- pnpm
- Bun

If no lockfile is found, Omnes will default to using npm.

### Omnes detects the package manager by looking for specific lockfiles in your project directory:

- Bun: bun.lockb
- pnpm: pnpm-lock.yaml
- npm: package-lock.json
- Yarn: yarn.lock

\*If none of these lockfiles are found, Omnes will default to using npm.

## Authors

This open source package is maintained by the darkroom.engineering team:

- Clément Roche ([@clementroche\_](https://twitter.com/clementroche_)) – [darkroom.engineering](https://darkroom.engineering)
- Guido Fier ([@uido15](https://twitter.com/uido15)) – [darkroom.engineering](https://darkroom.engineering)
- Leandro Soengas ([@lsoengas](https://twitter.com/lsoengas)) - [darkroom.engineering](https://darkroom.engineering)
- Franco Arza ([@arzafran](https://twitter.com/arzafran)) - [darkroom.engineering](https://darkroom.engineering)

<br/>

## License

[The MIT License.](https://opensource.org/licenses/MIT)
