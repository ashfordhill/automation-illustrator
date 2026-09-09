import { expect, test } from "vitest";
import { oakParkInvoice } from "../demos/oakParkInvoice";
import { robotMailroom } from "../demos/robotMailroom";
import oakParkYaml from "../demos/oak-park-invoice.yaml?raw";
import mailroomYaml from "../demos/robot-mailroom.yaml?raw";
import { parseDocument } from "./migrate";
import {
  workflowExportFilename,
  workflowToYaml,
} from "./serialize";
import { emptyWorkflow } from "./types";

test("demo YAML fixtures parse to the same documents as the loaders", () => {
  const oak = parseDocument(oakParkYaml);
  const mail = parseDocument(mailroomYaml);
  expect(oak.ok).toBe(true);
  expect(mail.ok).toBe(true);
  if (oak.ok) expect(oak.doc).toEqual(oakParkInvoice());
  if (mail.ok) expect(mail.doc).toEqual(robotMailroom());
});

test("YAML round-trip keeps a validated v2 document", () => {
  for (const doc of [oakParkInvoice(), robotMailroom(), emptyWorkflow()]) {
    const yaml = workflowToYaml(doc);
    expect(yaml.startsWith("{")).toBe(false);
    const parsed = parseDocument(yaml);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.doc).toEqual(doc);
  }
});

test("JSON files still import (YAML 1.2 is a JSON superset)", () => {
  const json = JSON.stringify(oakParkInvoice(), null, 2);
  const parsed = parseDocument(json);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) expect(parsed.doc).toEqual(oakParkInvoice());
});

test("YAML comments are ignored and hex colors stay strings", () => {
  const parsed = parseDocument(oakParkYaml);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  const alice = parsed.doc.actors.find((a) => a.id === "h_alice");
  expect(alice?.color).toBe("#ff9fbf");
  expect(parsed.doc.nodes.find((n) => n.id === "s_enter")).toMatchObject({
    title: "BS&A Software",
  });
});

test("export filename slugs the project name", () => {
  expect(workflowExportFilename(oakParkInvoice())).toBe("oak-park-invoice.yaml");
  expect(workflowExportFilename(robotMailroom())).toBe("robot-mailroom.yaml");
  expect(workflowExportFilename(emptyWorkflow())).toBe("untitled.yaml");
  expect(workflowExportFilename({ name: "  " })).toBe("untitled.yaml");
});

test("invalid text is rejected before the document is touched", () => {
  const result = parseDocument("{");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.code).toBe("invalid-json");
    expect(result.message).toMatch(/YAML or JSON/);
  }
});
