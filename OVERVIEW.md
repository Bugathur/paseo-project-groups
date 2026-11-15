Project groups is a sidebar view that adds a level above projects. Groups hold projects, and projects hold their workspaces. You can drag projects between groups, reorder projects inside a group, and drag group headers to reorder the groups.

## Setup

Requires Paseo 0.16.0-beta.2 or later on the daemon and the app. Choose Project groups in Settings, Sidebar, Sidebar view. Switching back to the default view restores the built-in sidebar, and your groups are kept.

## Using it

- New group at the top of the list creates a group and opens its name for editing.
- With a mouse, press a project row and drag it. Drop it on a group header to add it to the end of that group, or between two projects where the line appears. On touch screens, long-press the row first.
- Projects that are not in a group appear under Ungrouped, sorted by name. Newly added projects appear there too.
- The ⋯ menu on a project moves it to a group, starts a new workspace, copies its path, changes its icon and color, or removes the project.
- The ⋯ menu on a workspace renames it, pins or unpins it, copies its path or branch name, sets its color, or archives it.
- Deleting a group keeps its projects. They move to Ungrouped.

## Colors and icons

Click a project's folder icon, a group's palette button, or Set color in a workspace menu. Pick one of 11 colors and, for groups and projects, one of 36 icons or any emoji. The color applies to both the name and the icon. These colors and icons are stored by the plugin and only show in this sidebar view. Paseo's own project icons do not change.

## Appearance and language

The sliders button next to New group opens the plugin settings. You can set the text size from 11 to 15 pt, the row spacing and the indentation, and turn bold group names, folder icons, status dots, changed-line counts and the Pinned section on or off. The plugin language can follow the app or be set to English or Korean. These settings are stored on each device.

## Data and permissions

Groups, their order, and the chosen colors and icons are stored in the plugin's settings on the daemon, so every app connected to that daemon shows the same groups. Folding state is stored on each device. The plugin makes no network requests.

Removing a project runs `paseo project delete` on the daemon host, because the plugin API has no call for it. The plugin first checks that the project belongs to that daemon. Paseo archives the project's workspaces and leaves the project folder on disk. Worktree folders that Paseo created can be deleted when their workspaces are archived, and the confirmation dialog warns about this first. Projects from other connected hosts cannot be removed from this menu.

## Limits

- Workspaces cannot be dragged, because each workspace belongs to its project's folder.
- Pinned workspaces appear in the Pinned section unless you turn that section off.
- Removing the plugin deletes its stored groups, colors and icons.
- Dragging on touch screens has not been tested on a physical phone.
