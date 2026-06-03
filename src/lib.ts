import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Supported package managers — single source of truth for the name list. The
// PackageManager type is derived from it so the two cannot drift.
export const PACKAGE_MANAGERS = ["bun", "pnpm", "npm", "yarn"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

function isPackageManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

// Lockfile → package manager, in detection-priority order: within a directory
// the first match wins. Mirrors the table in the README.
export const LOCKFILES: ReadonlyArray<readonly [string, PackageManager]> = [
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
];

// npm built-in commands that don't require a "run" prefix
export const NPM_BUILTIN_COMMANDS = new Set([
  "access",
  "adduser",
  "audit",
  "bugs",
  "cache",
  "ci",
  "completion",
  "config",
  "dedupe",
  "deprecate",
  "diff",
  "dist-tag",
  "docs",
  "doctor",
  "edit",
  "exec",
  "explain",
  "explore",
  "find-dupes",
  "fund",
  "get",
  "help",
  "help-search",
  "hook",
  "init",
  "install",
  "install-ci-test",
  "install-test",
  "link",
  "ll",
  "login",
  "logout",
  "ls",
  "org",
  "outdated",
  "owner",
  "pack",
  "ping",
  "pkg",
  "prefix",
  "profile",
  "prune",
  "publish",
  "query",
  "rebuild",
  "repo",
  "restart",
  "root",
  "run",
  "run-script",
  "search",
  "set",
  "shrinkwrap",
  "star",
  "stars",
  "start",
  "stop",
  "team",
  "test",
  "token",
  "uninstall",
  "unpublish",
  "unstar",
  "update",
  "version",
  "view",
  "whoami",
]);

// Short aliases for npm commands
export const NPM_COMMAND_ALIASES = new Set([
  "i", // install
  "in", // install
  "ins", // install
  "inst", // install
  "isnt", // install (npm tolerates this typo as an alias)
  "it", // install-test
  "cit", // install-ci-test
  "add", // install
  "rm", // uninstall
  "remove", // uninstall
  "un", // uninstall
  "unlink", // uninstall
  "ln", // link
  "t", // test
  "tst", // test
  "up", // update
  "c", // config
  "s", // search
  "se", // search
  "rb", // rebuild
  "x", // exec
]);

/**
 * Parse Corepack's `packageManager` field (e.g. "pnpm@9.1.0+sha512.abc") and
 * return the package-manager name if it is one we support, otherwise undefined.
 */
export function parsePackageManagerField(
  value: unknown,
): PackageManager | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const name = value.split("@", 1)[0]?.trim();
  if (name !== undefined && isPackageManager(name)) {
    return name;
  }
  return undefined;
}

/**
 * Read a valid Corepack `packageManager` hint from the package.json in `dir`,
 * if one exists. Malformed JSON is ignored so detection falls back to lockfiles.
 */
function corepackHint(dir: string): PackageManager | undefined {
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) {
    return undefined;
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      packageManager?: unknown;
    };
    return parsePackageManagerField(pkg.packageManager);
  } catch {
    return undefined;
  }
}

/**
 * Detect the package manager by walking up from `startDir` to the filesystem
 * root. This supports monorepos where the lockfile lives in a parent directory.
 *
 * Within each directory an explicit Corepack `packageManager` field wins over a
 * lockfile, and the closest directory with any signal wins overall. Falls back
 * to npm when nothing is found.
 */
export function detectPackageManager(startDir: string): PackageManager {
  let currentDir = startDir;

  while (true) {
    const hint = corepackHint(currentDir);
    if (hint !== undefined) {
      return hint;
    }

    for (const [lockfile, pm] of LOCKFILES) {
      if (existsSync(join(currentDir, lockfile))) {
        return pm;
      }
    }

    const parentDir = dirname(currentDir);
    // Reached the filesystem root (dirname is idempotent there).
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return "npm";
}

/**
 * Transform arguments for npm to handle built-in vs script commands. npm
 * requires a "run" prefix for custom scripts, but not for built-in commands.
 */
export function transformArgsForNpm(args: readonly string[]): string[] {
  const command = args[0];
  if (command === undefined) {
    return [];
  }

  // "run"/"run-script" and built-in commands or aliases pass through as-is.
  if (
    command === "run" ||
    command === "run-script" ||
    NPM_BUILTIN_COMMANDS.has(command) ||
    NPM_COMMAND_ALIASES.has(command)
  ) {
    return [...args];
  }

  // Otherwise, prepend "run" for custom scripts.
  return ["run", ...args];
}

/**
 * Resolve the final argument vector to hand to the package manager. Only npm
 * needs the script/built-in disambiguation; the others run scripts directly.
 */
export function resolveArgs(
  packageManager: PackageManager,
  args: readonly string[],
): string[] {
  return packageManager === "npm" ? transformArgsForNpm(args) : [...args];
}

/**
 * Read the CLI version from the package.json shipped alongside this module.
 * Resolves correctly from both `dist/lib.js` and `src/lib.ts` (both are one
 * directory below the package root).
 */
export function readVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version?: unknown };
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
