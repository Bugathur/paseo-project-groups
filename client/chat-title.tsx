import { useAgent, useSettings, type AgentRef, type PluginSidebarViewProps } from "@getpaseo/plugin/client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { chatTitlesDocument } from "../shared/settings";
import { stableJson, useSettingsSaver } from "./save";

type Selection = Record<string, AgentRef>;
const SelectionContext = createContext<Selection>({});

/** Recheck the whole condition when focus, status or settings readiness changes. */
function Observe({ reference, workspaceKey, ready, select }: {
  reference: AgentRef; workspaceKey: string | null;
  ready: boolean;
  select(workspace: string, agent: AgentRef): void;
}) {
  const agent = useAgent(reference);
  const status = agent?.status;
  const agentWorkspaceKey = agent?.workspace.key;
  useEffect(() => {
    if (ready && status === "running" && agentWorkspaceKey && workspaceKey === agentWorkspaceKey)
      select(agentWorkspaceKey, reference);
  }, [ready, status, agentWorkspaceKey, workspaceKey, reference, select]);
  return null;
}

export function ChatTitles({ active, children }: {
  active: PluginSidebarViewProps["active"]; children: ReactNode;
}) {
  const state = useSettings(chatTitlesDocument);
  const saver = useSettingsSaver(state);
  const [pending, setPending] = useState<Selection | null>(null);
  const selected = pending ?? (state.status === "ready" ? state.values.selected : {});
  const latest = useRef(selected);
  latest.current = selected;
  const revision = state.status === "ready" ? state.revision : null;
  useEffect(() => {
    if (!saver.busy() && state.status === "ready" &&
        stableJson(state.values.selected) === stableJson(latest.current)) setPending(null);
  }, [revision, saver, state]);
  const ready = state.status === "ready";
  const selectionVersion = useRef(0);
  const select = useCallback((workspace: string, agent: AgentRef) => {
    if (!ready || latest.current[workspace]?.key === agent.key) return;
    const version = ++selectionVersion.current;
    const next = { ...latest.current, [workspace]: agent };
    latest.current = next;
    setPending(next);
    void saver.save({ selected: next }).then((saved) => {
      if (!saved && selectionVersion.current === version) setPending(null);
    }).catch(() => {
      if (selectionVersion.current === version) setPending(null);
    });
  }, [ready, saver]);
  return <SelectionContext.Provider value={selected}>
    {active.agent && <Observe key={active.agent.key} reference={active.agent}
      workspaceKey={active.workspace?.key ?? null} ready={ready} select={select} />}
    {children}
  </SelectionContext.Provider>;
}

/** The reader stays subscribed to renames and deletion even when another tab is focused. */
export function useChatTitle(workspaceKey: string): string | null {
  const reference = useContext(SelectionContext)[workspaceKey];
  // useAgent requires a ref; a missing ID produces null and never navigates or mutates data.
  const agent = useAgent(reference ?? "", (item) => ({ title: item.title, workspace: item.workspace.key }));
  return agent?.workspace === workspaceKey && agent.title?.trim() ? agent.title : null;
}
