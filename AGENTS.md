# Working on this fork

This is `Bugathur/paseo-project-groups`, a fork of
`topar12/paseo-project-groups`. It is a Paseo sidebar plugin written in
TypeScript and React Native. The owner's development assistant is OpenCode
with OpenAI GPT. Use these repository instructions directly; no Claude-specific
tools or setup are required. Reply to the owner in Russian unless asked otherwise.

## Development and checks

- Use npm and keep `package-lock.json` in sync with dependency changes.
- CI uses Node.js 24. Install dependencies with `npm ci`.
- Run `npm run typecheck` and `npm test` after code changes, as CI does.
- Tests use Node's built-in runner: `node --test test/*.test.cjs`.
- There is no separate build, lint, or development-server script. Paseo loads
  the plugin from the checkout.
- Check installed `@getpaseo/plugin` declarations when using SDK APIs; the
  project is pinned to 0.17.2, and newer online examples may not apply.
- For UI changes, verify in Paseo when available and report any manual checks
  you could not perform.

## Code map

- `index.client.tsx`: sidebar view and appearance settings registration.
- `client/view.tsx`: main sidebar orchestration.
- `client/rows.tsx`, `client/dialogs.tsx`, `client/display-menu.tsx`: sidebar UI.
- `client/chat-title.tsx`: last-working-chat title selection and persistence.
- `client/relationship-model.ts`, `client/relationships.tsx`,
  `client/relationship-rail.tsx`: agent relationships and their presentation.
- `client/messages.ts`, `client/i18n.ts`: localized strings and locale handling.
- `index.server.ts`, `server/`: daemon-side registration and local actions.
- `shared/settings.ts`: persisted settings schemas and defaults.
- `shared/rpc.ts`: client/server RPC contracts.
- `test/`: regression tests; follow the existing CommonJS test patterns.
- `paseo-plugin.json`: plugin manifest; `OVERVIEW*.md`: plugin descriptions.

## Compatibility and data

- Keep the installation ID `project-groups` and existing settings document IDs
  stable. Changing them can disconnect users from saved settings.
- Groups and decorations are host-scoped; appearance, folding, and chat-title
  history are device-scoped. Preserve those boundaries.
- Preserve the fork's **Last selected chat title** mode: select the focused
  agent when it transitions to `running`, not when the user merely switches
  tabs. Read titles reactively, persist only the agent reference, and fall back
  to the workspace title when the referenced chat is missing or untitled.
- Do not rename workspace metadata or branches to implement display titles.
- Keep agent handling provider-neutral through the Paseo SDK. OpenCode/OpenAI
  is the development setup, not a requirement to hardcode into plugin behavior.
- Follow existing React Native patterns and support desktop/web and touch UI.
- Update English, Korean, and Simplified Chinese strings together when adding
  user-facing messages.

## Local installation

On the daemon host, install with `paseo plugin install "$PWD" --id project-groups`
and reload with `paseo plugin reload project-groups`. Use the existing daemon's
`--home` or `--host` when needed. Do not uninstall the plugin to update it:
uninstalling deletes saved groups. Installation/reload affects the user's
running Paseo; perform it only when requested.

Keep changes focused, preserve unrelated local work, and do not commit or push
unless requested. Summarize the changes and actual verification results.
