const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "../client", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports });
  return exports;
}
const tree = load("group-tree.ts");
const model = load("model.ts");
const hit = load("hit.ts");
const plain = value => JSON.parse(JSON.stringify(value));
const groups = [
  { id: "a", name: "A", projects: ["p1"] },
  { id: "b", name: "B", parentId: "a", projects: ["p2"] },
  { id: "c", name: "C", parentId: "b", projects: ["p3"] },
];
test("old groups stay roots; nested paths and ancestors preserve IDs", () => {
  assert.equal(tree.groupParent(groups, "a"), null);
  assert.equal(tree.groupPath(groups, "c"), "A / B / C");
  assert.deepEqual(plain(tree.groupAncestors(groups, "c")), ["b", "a"]);
});
test("group moves reject self, descendants and missing destinations", () => {
  assert.equal(tree.moveGroupInto(groups, "a", "a"), null);
  assert.equal(tree.moveGroupInto(groups, "a", "c"), null);
  assert.equal(tree.moveGroupInto(groups, "a", "missing"), null);
  const moved = tree.moveGroupInto(groups, "b", null);
  assert.equal(tree.groupParent(moved, "b"), null);
  assert.equal(tree.groupParent(moved, "c"), "b");
});
test("invalid parents and cycles never hide groups or recurse forever", () => {
  const invalid = [{ id: "a", parentId: "b" }, { id: "b", parentId: "a" }, { id: "c", parentId: "gone" }];
  for (const group of invalid) assert.equal(tree.groupParent(invalid, group.id), null);
});
test("deleting a subgroup preserves projects and promotes its children", () => {
  const next = model.removeGroup(groups, "b");
  assert.deepEqual(plain(next.find(group => group.id === "a").projects), ["p1", "p2"]);
  assert.equal(next.find(group => group.id === "c").parentId, "a");
  const rootRemoved = model.removeGroup(groups, "a");
  assert.equal(rootRemoved.find(group => group.id === "b").parentId, null);
});
test("group drag distinguishes nesting from sibling order and host sections accept projects", () => {
  const slots = [{ slot: { kind: "group", groupId: "b", parentId: "a", index: 1 }, y: 100, height: 40 }];
  const subject = { kind: "group", id: "c" };
  assert.equal(hit.hitTest(subject, slots, 120).target.kind, "group-into");
  assert.deepEqual(plain(hit.hitTest(subject, slots, 101).target), { kind: "group-at", index: 1, parentId: "a" });
  const target = hit.hitTest({ kind: "project", key: "p" }, [
    { slot: { kind: "host", groupId: "b" }, y: 0, height: 30 },
  ], 10);
  assert.deepEqual(plain(target.target), { kind: "into-group", groupId: "b" });
});
