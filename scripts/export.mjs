import { writeFileSync } from "node:fs";

const out = process.argv.slice(2).find((a) => !a.startsWith("-")) ?? "workflow.json";

const alice = "h_alice";
const robot = "r_script";
const read = "s_read";
const web = "s_web";
const fs = "s_fs";
const acct = "d_acct";
const enter = "s_enter";
const review = "s_review";

const doc = {
  version: 1,
  actors: [
    { id: alice, kind: "human", name: "Alice", color: "#f4c6d4", role: "worker" },
    { id: "h_roy", kind: "human", name: "Roy", color: "#c5d4ea", role: "worker" },
    { id: "h_jack", kind: "human", name: "Jack", color: "#c5e0d6", role: "worker" },
    { id: "h_missy", kind: "human", name: "Missy", color: "#d5c6e6", role: "worker" },
    { id: robot, kind: "robot", name: "Robot", color: "#8aa8b8", robotKind: "script" },
  ],
  nodes: [
    { id: read, type: "step", position: { x: 32, y: 160 }, stepKind: "read", title: "invoice.pdf", detail: "", split: "exclusive" },
    { id: web, type: "step", position: { x: 352, y: 32 }, stepKind: "search", title: "website", detail: "", split: "exclusive" },
    { id: fs, type: "step", position: { x: 352, y: 352 }, stepKind: "search", title: "filesystem", detail: "", split: "exclusive" },
    { id: acct, type: "dataField", position: { x: 672, y: 192 }, label: "Account #" },
    { id: enter, type: "step", position: { x: 864, y: 160 }, stepKind: "write", title: "BS&A Software", detail: "", split: "exclusive" },
    { id: review, type: "step", position: { x: 1184, y: 160 }, stepKind: "review", title: "BS&A Software", detail: "", split: "exclusive" },
  ],
  edges: [
    { id: "e_gt", source: read, target: web, label: "invoice > $50,000", dashed: false },
    { id: "e_lt", source: read, target: fs, label: "invoice < $50,000", dashed: true },
    { id: "e_web_acct", source: web, target: acct, label: "" },
    { id: "e_fs_acct", source: fs, target: acct, label: "" },
    { id: "e_acct_enter", source: acct, target: enter, label: "" },
    { id: "e_enter_review", source: enter, target: review, label: "" },
  ],
  assignments: {
    before: { [read]: alice, [web]: alice, [fs]: alice, [enter]: alice, [review]: alice },
    after: { [read]: robot, [web]: robot, [fs]: robot, [enter]: robot, [review]: alice },
  },
};

writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", "utf8");
console.log(`Wrote ${out}`);
