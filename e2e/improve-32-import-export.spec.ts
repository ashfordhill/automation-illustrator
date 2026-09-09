import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const MAIL_STEP = "Read incoming mail";
const EVIDENCE = ".docs/evidence/improve-32-import-export";
const MAILROOM_YAML = readFileSync("src/demos/robot-mailroom.yaml", "utf8");
const OAK_PARK_YAML = readFileSync("src/demos/oak-park-invoice.yaml", "utf8");

const MINI_JSON = JSON.stringify({
  version: 2,
  name: "Mini JSON",
  actors: [],
  nodes: [
    {
      id: "s_root",
      type: "step",
      position: { x: 0, y: 0 },
      stepKind: "other",
      title: "Task",
      detail: "",
      split: "exclusive",
    },
  ],
  edges: [],
  assignments: {},
  after: { assignments: {}, groups: [], extraNodes: [], extraEdges: [] },
});

const CYCLE_YAML = `version: 2
actors: []
nodes:
  - id: a
    type: step
    position: { x: 0, y: 0 }
    stepKind: other
    title: A
    detail: ""
    split: exclusive
  - id: b
    type: step
    position: { x: 0, y: 40 }
    stepKind: other
    title: B
    detail: ""
    split: exclusive
edges:
  - id: e1
    source: a
    target: b
    label: ""
  - id: e2
    source: b
    target: a
    label: ""
assignments: {}
after:
  assignments: {}
  groups: []
  extraNodes: []
  extraEdges: []
`;

const V1_JSON = JSON.stringify({
  version: 1,
  actors: [
    { id: "h_alice", kind: "human", name: "Alice", color: "#f4c6d4" },
    { id: "r_script", kind: "robot", name: "Robot", color: "#8aa8b8", robotKind: "script" },
  ],
  nodes: [
    {
      id: "s_read",
      type: "step",
      position: { x: 32, y: 160 },
      stepKind: "read",
      title: "legacy.pdf",
      detail: "",
      split: "exclusive",
      stub: true,
    },
    {
      id: "d_acct",
      type: "dataField",
      position: { x: 672, y: 192 },
      label: "Account #",
    },
  ],
  edges: [{ id: "e_acct", source: "s_read", target: "d_acct", label: "" }],
  assignments: { before: { s_read: "h_alice" }, after: { s_read: "r_script" } },
});

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

async function importFile(
  page: Page,
  name: string,
  mimeType: string,
  contents: string,
) {
  await page.setInputFiles('input[type="file"]', {
    name,
    mimeType,
    buffer: Buffer.from(contents),
  });
}

test.describe("Improvement 32 import and export", () => {
  test("hamburger Export downloads YAML of the open board", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await expect(page.getByRole("menuitem", { name: "Export" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/hamburger-export-1440.png`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("oak-park-invoice.yaml");
    const path = await download.path();
    expect(path).toBeTruthy();
    const text = readFileSync(path!, "utf8");
    expect(text).toContain("name: Oak Park Invoice");
    expect(text).toContain("version: 2");
    expect(text.trimStart().startsWith("{")).toBe(false);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });

  test("Export then Import of that YAML restores the board", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Export" }).click();
    const yaml = readFileSync((await (await downloadPromise).path())!, "utf8");

    await openMenu(page);
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("This board is empty.")).toBeVisible();

    await importFile(page, "round-trip.yaml", "text/yaml", yaml);
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
  });

  test("Import YAML loads Robot Mailroom through the replace gate", async ({ page }) => {
    await loadDemo(page);
    await importFile(page, "robot-mailroom.yaml", "text/yaml", MAILROOM_YAML);
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(DEMO_STEP)).toHaveCount(0);
    await waitForLayout(page);
    await capturePage(page, `${EVIDENCE}/import-mailroom-1440.png`);
  });

  test("Import JSON and .yml still load", async ({ page }) => {
    await loadDemo(page);
    await importFile(page, "mini.json", "application/json", MINI_JSON);
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Task").first()).toBeVisible({ timeout: 15_000 });

    await importFile(page, "oak.yml", "text/yaml", OAK_PARK_YAML);
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Import v1 JSON migrates on the board", async ({ page }) => {
    await loadDemo(page);
    await importFile(page, "legacy.json", "application/json", V1_JSON);
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Read legacy.pdf").first()).toBeVisible({ timeout: 15_000 });
  });

  test("Cancel import leaves Oak Park", async ({ page }) => {
    await loadDemo(page);
    await importFile(page, "robot-mailroom.yaml", "text/yaml", MAILROOM_YAML);
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });

  test("invalid YAML does not replace the live board", async ({ page }) => {
    await loadDemo(page);
    await importFile(page, "bad.yaml", "text/yaml", "{");
    await expect(page.getByRole("dialog", { name: "Could not import" })).toBeVisible();
    await expect(page.getByText("not valid YAML or JSON")).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });

  test("empty file and cyclic YAML are rejected", async ({ page }) => {
    await loadDemo(page);
    await importFile(page, "empty.yaml", "text/yaml", "");
    await expect(page.getByRole("dialog", { name: "Could not import" })).toBeVisible();
    await expect(page.getByText("empty")).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();

    await importFile(page, "cycle.yaml", "text/yaml", CYCLE_YAML);
    await expect(page.getByRole("dialog", { name: "Could not import" })).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });

  test("New board Export is untitled.yaml", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("This board is empty.")).toBeVisible();
    await openMenu(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("untitled.yaml");
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Export remains in the hamburger at 1024", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await expect(page.getByRole("menuitem", { name: "Export" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/hamburger-export-1024.png`);
  });
});
