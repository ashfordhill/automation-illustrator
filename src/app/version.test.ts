import { expect, test } from "vitest";
import { APP_VERSION } from "./version";

test("APP_VERSION is injected from package.json", () => {
  expect(APP_VERSION).toBe("1.2.0");
});
