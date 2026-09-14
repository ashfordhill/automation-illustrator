import { expect, test } from "vitest";
import pkg from "../../package.json";
import { APP_VERSION } from "./version";

test("APP_VERSION is injected from package.json", () => {
  // Compare against the manifest itself so a version bump never leaves a stale literal here.
  // JSON import (resolveJsonModule) rather than node:fs: the Docker build has no @types/node.
  expect(APP_VERSION).toBe(pkg.version);
});
