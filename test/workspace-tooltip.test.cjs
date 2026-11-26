const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function setup() {
  const exports = {};
  const timers = new Map(); let id = 0;
  const modules = { react: React, "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": { View: "View", Text: "Text" } };
  vm.runInNewContext(ts.transpileModule(readFileSync(path.join(__dirname, "../client/workspace-tooltip.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, require: name => modules[name],
    setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: id => timers.delete(id),
  });
  let controls, tree;
  function Child() { controls = exports.useWorkspaceTooltip(); return null; }
  act(() => { tree = create(React.createElement(exports.WorkspaceTooltipProvider, {
    theme: { colors: {} },
  }, React.createElement(Child)), {
    createNodeMock: () => ({ measureInWindow: cb => cb(0, 20, 280, 600) }),
  }); });
  const flush = () => act(() => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); });
  return { get controls() { return controls; }, tree, flush };
}

test("tooltip displays the target host path and replaces it when hovering another workspace", () => {
  const h = setup();
  const target = { measureInWindow: cb => cb(0, 120, 280, 28) };
  act(() => h.controls.show(target, "/remote/host-a/project"));
  assert.equal(h.tree.root.findAllByType("Text").length, 0);
  h.flush();
  assert.equal(h.tree.root.findByType("Text").props.children, "/remote/host-a/project");
  act(() => h.controls.show(target, "C:\\host-b\\project"));
  h.flush();
  assert.equal(h.tree.root.findByType("Text").props.children, "C:\\host-b\\project");
  act(() => h.controls.hide());
  assert.equal(h.tree.root.findAllByType("Text").length, 0);
  act(() => h.tree.unmount());
});

test("leaving the row cancels pending hover and stale measurements cannot reopen the tooltip", () => {
  const h = setup(); let measure;
  act(() => h.controls.show({ measureInWindow: cb => { measure = cb; } }, "/remote/path"));
  h.flush();
  act(() => h.controls.hide());
  act(() => measure(0, 120, 280, 28));
  assert.equal(h.tree.root.findAllByType("Text").length, 0);
  act(() => h.controls.show({ measureInWindow() { assert.fail("cancelled hover measured"); } }, "/remote/path"));
  act(() => h.controls.hide()); h.flush();
  act(() => h.tree.unmount());
});
