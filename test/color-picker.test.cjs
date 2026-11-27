const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const modules = {
  react: React,
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": { View: "View" },
  "@getpaseo/plugin/client/ui": { TextInput: "TextInput" },
};
const exported = {};
vm.runInNewContext(ts.transpileModule(
  readFileSync(require("node:path").join(__dirname, "../client/color-picker.tsx"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText, { exports: exported, require: name => {
  assert.ok(modules[name], name);
  return modules[name];
} });

test("color picker validates HEX, follows external selections and maps drag positions to colors", async () => {
  let tree;
  let color = "#FF0000";
  const writes = [];
  const render = () => React.createElement(exported.ColorPicker, {
    color, foreground: "black", border: "gray", onChange(value) {
      color = value;
      writes.push(value);
      tree.update(render());
    },
  });
  await act(async () => { tree = create(render()); });
  const field = () => tree.root.findByType("TextInput");
  await act(async () => field().props.onChangeText("#12"));
  assert.equal(writes.length, 0);
  await act(async () => field().props.onChangeText("00ff00"));
  assert.equal(color, "#00FF00");
  assert.equal(field().props.value, "#00FF00");
  await act(async () => tree.root.findAllByType("View")[0].props.onLayout({ nativeEvent: { layout: { width: 200 } } }));
  const plane = () => tree.root.findByProps({ accessibilityLabel: "Saturation / brightness" });
  await act(async () => plane().props.onResponderGrant({ nativeEvent: { locationX: 200, locationY: 60 } }));
  assert.equal(color, "#008000");
  await act(async () => plane().props.onResponderMove({ nativeEvent: { locationX: -10, locationY: -10 } }));
  assert.equal(color, "#FFFFFF");
  // Picking a neutral color retains the hue for the next saturation gesture.
  await act(async () => plane().props.onResponderMove({ nativeEvent: { locationX: 200, locationY: 0 } }));
  assert.equal(color, "#00FF00");
  await act(async () => { color = "#0000FF"; tree.update(render()); });
  assert.equal(field().props.value, "#0000FF");
  await act(async () => plane().props.onResponderGrant({ nativeEvent: { locationX: 200, locationY: 0 } }));
  assert.equal(color, "#0000FF");
  await act(async () => tree.unmount());
});
