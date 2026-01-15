#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

// Package version - synced with package.json
const VERSION = "0.1.0";

// Supported package managers
type PackageManager = "bun" | "pnpm" | "npm" | "yarn";

// Lockfile to package manager mapping
const LOCKFILES: Record<string, PackageManager> = {
  "bun.lockb": "bun",
  "bun.lock": "bun",
  "pnpm-lock.yaml": "pnpm",
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
};

// npm built-in commands that don't require "run" prefix
const NPM_BUILTIN_COMMANDS = new Set([
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
const NPM_COMMAND_ALIASES = new Set([
  "i", // install
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
  "r", // uninstall
  "rb", // rebuild
  "x", // exec
]);

/**
 * Print help message to stderr
 */
function printHelp(): void {
  console.error(`
omnes v${VERSION} - Universal package manager CLI

USAGE:
  omnes <command> [args...]
  omnes [options]

OPTIONS:
  -h, --help     Show this help message
  -v, --version  Show version number

DESCRIPTION:
  Automatically detects and uses the correct package manager for your project
  by looking for lockfiles (bun.lockb, pnpm-lock.yaml, package-lock.json, yarn.lock).

  Supports monorepo setups by traversing parent directories to find lockfiles.

EXAMPLES:
  omnes install           Install dependencies
  omnes run dev           Run the dev script
  omnes test              Run tests
  omnes add lodash        Add a package
  omnes exec tsc --help   Execute a package binary

SUPPORTED PACKAGE MANAGERS:
  - bun (bun.lockb, bun.lock)
  - pnpm (pnpm-lock.yaml)
  - npm (package-lock.json)
  - yarn (yarn.lock)

If no lockfile is found, defaults to npm.
`);
}

/**
 * Print version to stderr
 */
function printVersion(): void {
  console.error(`omnes v${VERSION}`);
}

/**
 * Detect package manager by traversing up the directory tree looking for lockfiles.
 * This supports monorepo setups where the lockfile is in a parent directory.
 */
function detectPackageManager(startDir: string): PackageManager {
  let currentDir = startDir;
  const root = dirname(currentDir);

  // Traverse up the directory tree
  while (currentDir !== root) {
    for (const [lockfile, pm] of Object.entries(LOCKFILES)) {
      const lockfilePath = join(currentDir, lockfile);
      if (existsSync(lockfilePath)) {
        return pm;
      }
    }

    const parentDir = dirname(currentDir);
    // Prevent infinite loop at filesystem root
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  // Default to npm if no lockfile is found
  return "npm";
}

/**
 * Transform arguments for npm to handle built-in vs script commands.
 * npm requires "run" prefix for custom scripts, but not for built-in commands.
 */
function transformArgsForNpm(args: readonly string[]): string[] {
  if (args.length === 0) {
    return [];
  }

  const [command, ...rest] = args;

  // If the command is already "run" or "run-script", pass through as-is
  if (command === "run" || command === "run-script") {
    return [...args];
  }

  // If it's a built-in command or alias, pass through as-is
  if (
    command !== undefined &&
    (NPM_BUILTIN_COMMANDS.has(command) || NPM_COMMAND_ALIASES.has(command))
  ) {
    return [...args];
  }

  // Otherwise, prepend "run" for custom scripts
  return ["run", ...args];
}

/**
 * Run the detected package manager with the given arguments.
 * Uses spawn without shell: true for security and proper argument handling.
 */
function runCommand(
  packageManager: PackageManager,
  args: readonly string[]
): void {
  // Transform args for npm if needed
  const finalArgs =
    packageManager === "npm" ? transformArgsForNpm(args) : [...args];

  // Spawn the package manager process
  const child = spawn(packageManager, finalArgs, {
    stdio: "inherit",
    // No shell: true - pass args directly for security and proper handling
  });

  // Handle spawn errors (e.g., ENOENT when package manager is not installed)
  child.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      console.error(
        `Error: Package manager "${packageManager}" is not installed or not in PATH.`
      );
      console.error(`Please install ${packageManager} and try again.`);
    } else {
      console.error(`Error spawning ${packageManager}: ${error.message}`);
    }
    process.exit(1);
  });

  // Exit with the same code as the child process
  child.on("close", (code: number | null) => {
    process.exit(code ?? 1);
  });
}

/**
 * Main entry point
 */
function main(): void {
  // Get arguments without node and script path
  const args = process.argv.slice(2);
  const firstArg = args[0];

  // Handle --help flag (only if it's the first argument)
  if (firstArg === "-h" || firstArg === "--help") {
    printHelp();
    process.exit(0);
  }

  // Handle --version flag (only if it's the first argument)
  if (firstArg === "-v" || firstArg === "--version") {
    printVersion();
    process.exit(0);
  }

  // Require at least one command
  if (args.length === 0) {
    console.error("Error: Please provide a command to run.");
    console.error('Run "omnes --help" for usage information.');
    process.exit(1);
  }

  // Detect package manager from current working directory
  const packageManager = detectPackageManager(process.cwd());

  // Informational message to stderr (so it doesn't interfere with stdout pipes)
  console.error(`Using: ${packageManager}`);

  // Run the command
  runCommand(packageManager, args);
}

main();
