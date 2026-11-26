const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ref = (kind, hostId, id) => ({ kind, hostId, id, key: `${kind}:${hostId}:${id}` });
const w1 = ref("workspace", "one", "same");
const w2 = ref("workspace", "two", "same");
const agent = (workspace, id) => ({
  ref: ref("agent", workspace.hostId, id), workspace, title: id, status: "idle",
});

function harness(initial = {}) {
  let selected = initial;
  let active = { agent: null, workspace: null };
  let agents = [agent(w1, "a"), agent(w1, "b"), agent(w2, "a")];
  let tree;
  let ready = true;
  let deferred = false;
  const writes = [];
  const saves = [];
  const saver = { busy: () => writes.length > 0, save: async (values) => {
    if (deferred) return new Promise(resolve => writes.push({ values, resolve }));
    selected = values.selected; saves.push(selected); return true;
  } };
  const modules = {
    react: React, "react/jsx-runtime": require("react/jsx-runtime"),
    "../shared/settings": { chatTitlesDocument: {} },
    "./save": { useSettingsSaver: () => saver, stableJson: JSON.stringify },
    "@getpaseo/plugin/client": {
      useSettings: () => ready ? ({ status: "ready", revision: String(saves.length), values: { selected } }) : ({ status: "loading" }),
      useAgents: () => agents.map(a => a.ref),
      useAgent: (reference, selector) => {
        const found = agents.find(a => a.ref.key === reference.key);
        return found ? selector ? selector(found) : found : null;
      },
    },
  };
  const exports = {};
  const source = readFileSync(require("node:path").join(__dirname, "../client/chat-title.tsx"), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { assert.ok(modules[name], name); return modules[name]; } });
  function Read({ workspace }) {
    return React.createElement("title", { workspace: workspace.key, value: exports.useChatTitle(workspace.key) });
  }
  const render = () => React.createElement(exports.ChatTitles, { active },
    React.createElement(Read, { workspace: w1 }), React.createElement(Read, { workspace: w2 }));
  return {
    saves,
    deferSaves() { deferred = true; },
    async finishSave(success) {
      await act(async () => {
        const write = writes.shift();
        if (success) { selected = write.values.selected; saves.push(selected); }
        write.resolve(success);
        tree.update(render());
      });
    },
    async mount() { await act(async () => { tree = create(render()); }); },
    async update(index, patch, focus = index) {
      if (index !== null) agents[index] = { ...agents[index], ...patch };
      active = focus === null ? { agent: null, workspace: w1 } :
        { agent: agents[focus].ref, workspace: agents[focus].workspace };
      await act(async () => { tree.update(render()); });
    },
    async remove(index) { agents.splice(index, 1); await act(async () => tree.update(render())); },
    async focus(index, workspace = agents[index].workspace) {
      active = { agent: agents[index].ref, workspace };
      await act(async () => tree.update(render()));
    },
    async settingsReady(value) { ready = value; await act(async () => tree.update(render())); },
    title(workspace) { return tree.root.findAllByType("title").find(n => n.props.workspace === workspace.key).props.value; },
    async unmount() { await act(async () => tree.unmount()); },
    saved() { return JSON.parse(JSON.stringify(selected)); },
  };
}

test("focused running chats select immediately; idle and non-chat tabs retain selection", async () => {
  const h = harness(); await h.mount();
  await h.update(0, {}); assert.equal(h.saves.length, 0);
  await h.update(0, { status: "running" }); assert.equal(h.title(w1), "a");
  await h.update(1, {}); assert.equal(h.title(w1), "a");
  await h.update(null, {}, null); assert.equal(h.title(w1), "a");
  await h.update(1, { status: "running" }, null); assert.equal(h.title(w1), "a");
  await h.update(1, {}); assert.equal(h.title(w1), "b");
  await h.update(0, {}); assert.equal(h.title(w1), "a");
  await h.update(1, {}); assert.equal(h.title(w1), "b");
  await h.update(1, { status: "idle" });
  assert.equal(h.title(w1), "b");
  await h.update(1, { status: "running" }); assert.equal(h.title(w1), "b");
  await h.unmount();
});

test("running status arriving before workspace focus is not lost", async () => {
  const h = harness(); await h.mount();
  await h.update(0, { status: "running" }, null);
  await h.focus(0, w2); assert.equal(h.title(w1), null);
  await h.focus(0, w1); assert.equal(h.title(w1), "a");
  const count = h.saves.length;
  await h.update(0, { title: "renamed" });
  assert.equal(h.title(w1), "renamed"); assert.equal(h.saves.length, count);
  await h.unmount();
});

test("settings readiness retries selection of the already running focused chat", async () => {
  const h = harness(); await h.mount();
  await h.settingsReady(false);
  await h.update(0, { status: "running" }); assert.equal(h.saves.length, 0);
  await h.settingsReady(true); assert.equal(h.title(w1), "a");
  await h.unmount();
});

test("rapid A-B-A switches keep the newest selection when an older save fails", async () => {
  const h = harness(); await h.mount(); h.deferSaves();
  await h.update(0, { status: "running" });
  await h.update(1, { status: "running" });
  await h.update(0, {}); assert.equal(h.title(w1), "a");
  await h.finishSave(true); assert.equal(h.title(w1), "a");
  await h.finishSave(false); assert.equal(h.title(w1), "a");
  await h.finishSave(true); assert.equal(h.title(w1), "a");
  assert.equal(h.saved()[w1.key].id, "a");
  await h.unmount();
});

test("host-qualified refs isolate identical workspace and agent IDs; rename and deletion are reactive", async () => {
  const h = harness(); await h.mount();
  await h.update(0, { status: "running" });
  await h.update(2, { status: "running", title: "remote" });
  assert.equal(h.title(w1), "a"); assert.equal(h.title(w2), "remote");
  await h.update(0, { title: "renamed" }, 2);
  assert.equal(h.title(w1), "renamed");
  await h.remove(0); assert.equal(h.title(w1), null); assert.equal(h.title(w2), "remote");
  await h.unmount();
});

test("saved selection restores after remount and missing or empty titles fall back", async () => {
  const first = harness(); await first.mount();
  await first.update(1, { status: "running" });
  const saved = first.saved(); await first.unmount();
  const restored = harness(saved); await restored.mount();
  assert.equal(restored.title(w1), "b"); assert.equal(restored.saves.length, 0);
  await restored.update(1, { title: "  " }, null); assert.equal(restored.title(w1), null);
  await restored.remove(1); assert.equal(restored.title(w1), null);
  await restored.unmount();
});
