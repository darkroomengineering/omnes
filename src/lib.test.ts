import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";
import {
  detectPackageManager,
  parsePackageManagerField,
  resolveArgs,
  transformArgsForNpm,
} from "./lib.js";

// Track temp roots so we can clean them up after the suite.
const tempRoots: string[] = [];

function makeTree(layout: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "omnes-test-"));
  tempRoots.push(root);
  for (const [relPath, contents] of Object.entries(layout)) {
    const full = join(root, relPath);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, contents);
  }
  return root;
}

after(() => {
  for (const root of tempRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("parsePackageManagerField", () => {
  test("extracts the manager name from a Corepack field", () => {
    assert.equal(parsePackageManagerField("pnpm@9.1.0"), "pnpm");
    assert.equal(parsePackageManagerField("yarn@3.6.0+sha512.abc123"), "yarn");
    assert.equal(parsePackageManagerField("bun@1.1.0"), "bun");
    assert.equal(parsePackageManagerField("npm@10.2.0"), "npm");
  });

  test("accepts a bare manager name without a version", () => {
    assert.equal(parsePackageManagerField("pnpm"), "pnpm");
  });

  test("rejects unknown or non-string values", () => {
    assert.equal(parsePackageManagerField("deno@1.0.0"), undefined);
    assert.equal(parsePackageManagerField(""), undefined);
    assert.equal(parsePackageManagerField(undefined), undefined);
    assert.equal(parsePackageManagerField(42), undefined);
  });
});

describe("detectPackageManager", () => {
  test("walks up to a parent lockfile (monorepo support)", () => {
    const root = makeTree({
      "pnpm-lock.yaml": "",
      "packages/api/package.json": "{}",
    });
    assert.equal(detectPackageManager(join(root, "packages", "api")), "pnpm");
  });

  test("closest lockfile wins over an ancestor lockfile", () => {
    const root = makeTree({
      "pnpm-lock.yaml": "",
      "packages/web/yarn.lock": "",
      "packages/web/src/package.json": "{}",
    });
    assert.equal(
      detectPackageManager(join(root, "packages", "web", "src")),
      "yarn",
    );
  });

  test("Corepack packageManager field beats a sibling lockfile", () => {
    const root = makeTree({
      "package.json": JSON.stringify({ packageManager: "bun@1.1.0" }),
      "yarn.lock": "",
    });
    assert.equal(detectPackageManager(root), "bun");
  });

  test("respects documented lockfile priority (yarn before npm)", () => {
    const root = makeTree({
      "yarn.lock": "",
      "package-lock.json": "",
    });
    assert.equal(detectPackageManager(root), "yarn");
  });

  test("defaults to npm when no signal is found", () => {
    const root = makeTree({ "src/index.ts": "" });
    assert.equal(detectPackageManager(join(root, "src")), "npm");
  });
});

describe("transformArgsForNpm", () => {
  test("prefixes custom scripts with run", () => {
    assert.deepEqual(transformArgsForNpm(["dev"]), ["run", "dev"]);
    assert.deepEqual(transformArgsForNpm(["build", "--flag"]), [
      "run",
      "build",
      "--flag",
    ]);
  });

  test("passes built-in commands through untouched", () => {
    assert.deepEqual(transformArgsForNpm(["test"]), ["test"]);
    assert.deepEqual(transformArgsForNpm(["install"]), ["install"]);
    assert.deepEqual(transformArgsForNpm(["run", "dev"]), ["run", "dev"]);
  });

  test("passes aliases through untouched", () => {
    assert.deepEqual(transformArgsForNpm(["add", "react"]), ["add", "react"]);
    assert.deepEqual(transformArgsForNpm(["i"]), ["i"]);
  });

  test("returns an empty array for empty input", () => {
    assert.deepEqual(transformArgsForNpm([]), []);
  });
});

describe("resolveArgs", () => {
  test("only npm gets the run-prefix transform", () => {
    assert.deepEqual(resolveArgs("npm", ["dev"]), ["run", "dev"]);
    assert.deepEqual(resolveArgs("bun", ["dev"]), ["dev"]);
    assert.deepEqual(resolveArgs("pnpm", ["build"]), ["build"]);
    assert.deepEqual(resolveArgs("yarn", ["dev"]), ["dev"]);
  });
});
