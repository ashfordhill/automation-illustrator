import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { APP_VERSION } from "./version";

test("APP_VERSION is injected from package.json", () => {
  // Compare against the file itself so a version bump never leaves a stale literal here.
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  expect(APP_VERSION).toBe(pkg.version);
});
