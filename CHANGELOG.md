# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-06-03

### Fixed

- **Monorepo detection now works.** The directory walk previously exited after
  checking only the starting directory, so running `omnes` from a sub-package
  fell back to npm instead of finding the lockfile at the repository root.
  Detection now walks up to the filesystem root.
- `--version` reads the version from `package.json` instead of a hardcoded
  string that had drifted out of sync.
- `--help` and `--version` print to stdout instead of stderr, so they pipe and
  redirect like other CLIs.
- A missing package manager now exits with code `127` (was `1`), matching the
  documented API.

### Added

- Corepack `packageManager` field detection. An explicit
  `"packageManager": "pnpm@9.x"` in `package.json` takes precedence over a
  lockfile in the same directory.
- The informational `Using:` line now shows the fully resolved command
  (e.g. `Using bun: bun run dev`).
- Unit tests covering traversal, Corepack detection, lockfile priority, and the
  npm argument transform; Biome lint/format; and a GitHub Actions CI workflow.

### Changed

- Internal: pure detection and argument logic extracted into `src/lib.ts`, with
  `src/omnes.ts` reduced to a thin executable entry point.
- Internal: `LOCKFILES` is an ordered tuple array rather than an object, so
  detection priority is explicit instead of relying on object key order. No
  behavior change.
- Internal: the supported package-manager list is a single `const` source of
  truth, with the `PackageManager` type derived from it and a type guard
  replacing a cast in Corepack-field parsing.

## [0.1.2] and earlier

Initial releases and documentation. See the git history for details.

[0.1.3]: https://github.com/darkroomengineering/omnes/releases/tag/v0.1.3
