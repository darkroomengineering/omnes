#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  detectPackageManager,
  type PackageManager,
  readVersion,
  resolveArgs,
} from "./lib.js";

const VERSION = readVersion();

/**
 * Print the help message to stdout (it is explicitly requested output).
 */
function printHelp(): void {
  console.log(`
omnes v${VERSION} - Universal package manager CLI

USAGE:
  omnes <command> [args...]
  omnes [options]

OPTIONS:
  -h, --help     Show this help message
  -v, --version  Show version number

DESCRIPTION:
  Automatically detects and uses the correct package manager for your project
  by reading a Corepack "packageManager" field or finding a lockfile
  (bun.lockb, pnpm-lock.yaml, yarn.lock, package-lock.json).

  Supports monorepo setups by traversing parent directories to find a lockfile.

EXAMPLES:
  omnes install           Install dependencies
  omnes run dev           Run the dev script
  omnes test              Run tests
  omnes add lodash        Add a package
  omnes exec tsc --help   Execute a package binary

SUPPORTED PACKAGE MANAGERS:
  - bun (bun.lockb, bun.lock)
  - pnpm (pnpm-lock.yaml)
  - yarn (yarn.lock)
  - npm (package-lock.json)

If no lockfile is found, defaults to npm.
`);
}

/**
 * Print the version to stdout (it is explicitly requested output).
 */
function printVersion(): void {
  console.log(`omnes v${VERSION}`);
}

/**
 * Run the detected package manager with the given arguments. Uses spawn without
 * `shell: true` for security and correct argument handling.
 */
function runCommand(
  packageManager: PackageManager,
  args: readonly string[],
): void {
  const finalArgs = resolveArgs(packageManager, args);

  // Informational message on stderr (so it never pollutes piped stdout). Shows
  // the fully resolved command so the proxying is transparent.
  console.error(
    `Using ${packageManager}: ${packageManager} ${finalArgs.join(" ")}`,
  );

  const child = spawn(packageManager, finalArgs, {
    stdio: "inherit",
    // No shell: true - pass args directly for security and proper handling.
  });

  // Handle spawn errors (e.g. ENOENT when the package manager is not installed).
  child.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      console.error(
        `Error: "${packageManager}" is not installed or not in PATH.`,
      );
      console.error(`Install ${packageManager} and try again.`);
      // 127 is the conventional "command not found" exit code.
      process.exit(127);
    }
    console.error(`Error spawning ${packageManager}: ${error.message}`);
    process.exit(1);
  });

  // Exit with the same code as the child process.
  child.on("close", (code: number | null) => {
    process.exit(code ?? 1);
  });
}

/**
 * Main entry point.
 */
function main(): void {
  const args = process.argv.slice(2);
  const firstArg = args[0];

  // Handle --help / --version only when they are the first argument.
  if (firstArg === "-h" || firstArg === "--help") {
    printHelp();
    process.exit(0);
  }
  if (firstArg === "-v" || firstArg === "--version") {
    printVersion();
    process.exit(0);
  }

  if (args.length === 0) {
    console.error("Error: Please provide a command to run.");
    console.error('Run "omnes --help" for usage information.');
    process.exit(1);
  }

  const packageManager = detectPackageManager(process.cwd());
  runCommand(packageManager, args);
}

main();
