import type { ProjectGroup } from "../shared/settings";

/** Invalid or cyclic ancestry is rendered at the root, never hidden. */
export function groupParent(groups: readonly ProjectGroup[], id: string): string | null {
  const byId = new Map(groups.map(group => [group.id, group]));
  const parent = byId.get(id)?.parentId;
  if (!parent || !byId.has(parent)) return null;
  const seen = new Set([id]);
  let cursor: string | null | undefined = parent;
  while (cursor && byId.has(cursor)) {
    if (seen.has(cursor)) return null;
    seen.add(cursor);
    cursor = byId.get(cursor)?.parentId;
  }
  return parent;
}

export function groupAncestors(groups: readonly ProjectGroup[], id: string): string[] {
  const result: string[] = [];
  let parent = groupParent(groups, id);
  while (parent && !result.includes(parent)) {
    result.push(parent);
    parent = groupParent(groups, parent);
  }
  return result;
}

export function moveGroupInto(groups: readonly ProjectGroup[], id: string, parentId: string | null): ProjectGroup[] | null {
  if (!groups.some(group => group.id === id)) return null;
  if (parentId !== null && (!groups.some(group => group.id === parentId) ||
      parentId === id || groupAncestors(groups, parentId).includes(id))) return null;
  if (groupParent(groups, id) === parentId) return null;
  return groups.map(group => group.id === id ? { ...group, parentId } : group);
}

export function groupPath(groups: readonly ProjectGroup[], id: string): string {
  return [...groupAncestors(groups, id).reverse(), id]
    .map(key => groups.find(group => group.id === key)?.name ?? key).join(" / ");
}
