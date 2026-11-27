# Project groups for Paseo — Bugathur fork

**Documentation language:** [Русский](README.md) · English

A Paseo sidebar with project groups, nested groups, and a more compact workspace layout.

This is a fork of [topar12/paseo-project-groups](https://github.com/topar12/paseo-project-groups). The main additions are workspace titles from running chats, a group hierarchy, host sections, compact rows, and custom colors. This guide explains what differs from the original plugin and how to enable those features.

## What's new in this fork

| Feature | How to enable or use it |
| --- | --- |
| Workspace title from the last selected running chat | **Display → Title → Last selected chat title** |
| Nested groups | Group **⋯** menu → **Create subgroup**, or drag a group into another group |
| Collapsible host sections inside groups | **Display → Settings… → Workspaces → Group projects by host** |
| Compact `project: workspace` rows | **Display → Settings… → Workspaces → Compact project/workspace rows** |
| Expanded palette and custom HEX colors | Open the color dialog for a group, project, or workspace |
| Workspace path tooltip | Hover over a workspace row; available automatically |
| Hidden empty **Ungrouped** sections | Automatic; sections reappear as drop targets while dragging a project |

The new title mode, host grouping, and compact rows must be enabled manually. Host grouping and compact rows are off by default and can be configured independently.

The menu names below refer to the English interface. The plugin itself supports English, Korean, and Simplified Chinese.

## Installation and updates

### Requirements

- Paseo **0.17.2 or later** on both the daemon and the app.
- Plugin support enabled.
- Git, Node.js, and npm for installation from source. The development SDK is pinned to `@getpaseo/plugin@0.17.2`.

### Install this fork

Run these commands on the host running the Paseo daemon:

```bash
git clone https://github.com/Bugathur/paseo-project-groups.git
cd paseo-project-groups
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD" --id project-groups
paseo plugin reload project-groups
```

Then select **Settings → Sidebar → View → Project groups** in the app. Installing the plugin alone does not switch the sidebar automatically.

The sidebar's **Display** button opens quick settings. **Display → Settings…** opens the full **Appearance** page, where the new switches are in the **Workspaces** section.

### Switch from the original plugin

Install the fork from a local checkout using the command above, keeping the **`project-groups`** ID. Existing groups, colors, appearance settings, and folding state are associated with that ID. You do not need to uninstall the plugin before installing the fork: uninstalling deletes the saved groups.

If your daemon uses a non-default home directory or endpoint, specify it with `--home` or `--host`. The checkout directory must be on the daemon host and remain available for subsequent reloads. When using multiple daemons, install the fork on each relevant host with the same ID.

### Update a local installation

From this repository's directory on the daemon host:

```bash
git pull --ff-only
npm ci
npm run typecheck
npm test
paseo plugin reload project-groups
```

After making your own changes to an already installed checkout, also run `paseo plugin reload project-groups`.

## New features in detail

### Workspace titles from running chats

**Enable it:** **Display → Title → Last selected chat title**. The same option is available under **Display → Settings… → Workspaces → Workspace title**.

Instead of the usual workspace name, the sidebar shows the title of the chat you selected while its agent was running:

1. Open a chat in a workspace and start a task. When the active agent enters the `running` state, that chat becomes the title source.
2. Switching to another already running chat in that workspace updates the label to that chat's title.
3. Switching to an idle chat, terminal, or file does not replace the saved selection. The title remains after the task finishes.

The selected chat is remembered separately for each workspace, including its host identity. Renaming that chat updates the sidebar label even when another chat, terminal, or workspace is open. If the chat is deleted, unavailable, or has an empty title, the usual workspace name is shown instead.

The sidebar must be mounted to observe the selected chat's activity; activity missed while the client was closed is not reconstructed. The selection is stored separately for each client device. Actual workspace and branch names are not changed, and **Display → Show → Branch** remains independent.

### Nested groups

**Use it:** open a group's **⋯** menu and select **Create subgroup**. Move an existing group with **Move group to…**, or return it to the root with **Move to top level**. Destination lists show the full group path.

Drag and drop also supports nesting:

- Drop in the middle of another group's header to make it a subgroup.
- Drop near the top or bottom edge of a header to reorder at that level.
- On a phone or tablet, long-press a name before dragging; a quick swipe scrolls the list.

A group cannot be nested inside itself or one of its descendants. Deleting a group promotes its subgroups one level and moves its projects to the parent group, or to **Ungrouped** if the deleted group was at the root. Projects and workspaces themselves are not deleted.

This is separate from the inherited sub-project feature: project nesting is still limited to one level.

### Host sections

**Enable it:** **Display → Settings… → Workspaces → Group projects by host**.

In **By project** mode, projects inside each group are divided into collapsible sections by host. Section headers stand out with a background, a semibold name, and a server icon. Collapsed sections can show an aggregate status and highlight the active workspace, according to the sidebar settings.

Dropping a project onto a host section assigns it to the containing group. It does not transfer the project between hosts or daemons. **By relation** mode continues to show the agent tree.

### Compact project and workspace rows

**Enable it:** **Display → Settings… → Workspaces → Compact project/workspace rows**.

In **By project** mode, an expanded project with workspaces replaces its separate heading with rows such as:

```text
my-app: Fix login screen
my-app: Update dependencies
```

A project grip remains on the left: clicking it opens the project menu, and dragging it moves the entire project. Each workspace keeps its own menu on the right. Empty and collapsed projects retain their normal project row.

Compact mode can be combined with nested groups and host sections. For a denser list, the inherited **Text and spacing → Row spacing → Compact** setting also adjusts row height.

### Custom colors

**Use it:** open the decoration dialog through a group's icon or menu, **Change icon and color** in a project's menu, or the color action in a workspace's menu.

Instead of a single small palette, you get:

- **33 preset colors**: the original shades plus light and dark variants.
- A hue strip and a saturation/brightness field, usable with a mouse or touch.
- A **HEX** field for an exact six-digit color, such as `#7C3AED`.

Changes first appear in the dialog's preview. Press **Done** to save or **Cancel** to discard them. Custom colors are supported for groups, projects, and workspaces; icons and emoji remain available for groups and projects.

### Path tooltips and hidden empty sections

These improvements work immediately after installation:

- Hovering over a workspace in the desktop app or browser shows a tooltip with its path. This helps distinguish workspaces with similar names, including when chat titles are enabled.
- Empty **Ungrouped** sections, including per-host sections, are hidden. They temporarily reappear while dragging a project so you can move it out of a group.

## Features retained from the original plugin

The fork retains the core Project groups features:

- Create, rename, color, and collapse groups; move projects with a mouse or touch.
- Searchable Lucide icons and emoji for groups and projects.
- Collapse or expand the entire sidebar, with status indicators on collapsed rows.
- Parent–child agent relationships, relationship lines, and **By relation** mode.
- Workspace menus with pinning, labels, archiving, and read/unread state.
- Sorting, branch display, diff statistics, or activity timestamps through **Display**.
- Text size, row height, indentation, spacing between groups, and keyboard navigation.

For more about the original plugin, see the [upstream repository](https://github.com/topar12/paseo-project-groups).

## Where settings are stored

| Data | Storage scope |
| --- | --- |
| Groups, their hierarchy, project membership, and sub-projects | On the daemon; shared by its clients |
| Colors and icons for groups, projects, and workspaces | On the daemon; shared by its clients |
| Appearance, title mode, host sections, compact rows, and folding | Separately for each client device |
| Selected chat for each workspace title | Separately for each client device, in the `chat-titles` document |

Existing groups, colors, and folding state are preserved when installing with the same `project-groups` ID. Chat titles store an agent reference; the text itself is read from Paseo and updates when the chat is renamed.

The plugin does not contact external services or launch other programs. Operations unavailable through the plugin API, such as removing a project, use a local connection to the daemon.

## Development

```bash
npm ci
npm test
npm run typecheck
```

To check changes in Paseo, install the local checkout with the `project-groups` ID and reload the plugin as described above. Before finishing changes, run both local checks: `npm test` and `npm run typecheck`.

## License

MIT. Original plugin: [topar12/paseo-project-groups](https://github.com/topar12/paseo-project-groups); fork: [Bugathur/paseo-project-groups](https://github.com/Bugathur/paseo-project-groups).
