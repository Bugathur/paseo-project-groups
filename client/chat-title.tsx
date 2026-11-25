import { useAgent, useAgents, useSettings, type AgentRef, type PluginSidebarViewProps } from "@getpaseo/plugin/client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { chatTitlesDocument } from "../shared/settings";
import { useSettingsSaver } from "./save";

type Selection = Record<string, AgentRef>;
const SelectionContext = createContext<Selection>({});

/** Navigation alone, including switching to an already running chat, is not a start. */
export function didStart(previous: string | null, current: string | undefined): boolean {
  return previous !== null && previous !== "running" && current === "running";
}

function Observe({ reference, active, select, newlyAdded }: {
  reference: AgentRef; active: PluginSidebarViewProps["active"];
  newlyAdded: boolean;
  select(workspace: string, agent: AgentRef): void;
}) {
  const agent = useAgent(reference);
  const previous = useRef<string | null>(newlyAdded ? "initializing" : null);
  useEffect(() => {
    const started = didStart(previous.current, agent?.status);
    previous.current = agent?.status ?? null;
    if (started && agent && active.agent?.key === reference.key &&
        active.workspace?.key === agent.workspace.key) select(agent.workspace.key, reference);
  }, [agent, active.agent, active.workspace, reference, select]);
  return null;
}

export function ChatTitles({ active, children }: {
  active: PluginSidebarViewProps["active"]; children: ReactNode;
}) {
  const state = useSettings(chatTitlesDocument);
  const saver = useSettingsSaver(state);
  const agents = useAgents();
  const initialKeys = useRef(new Set(agents.map((agent) => agent.key)));
  const [pending, setPending] = useState<Selection | null>(null);
  const selected = pending ?? (state.status === "ready" ? state.values.selected : {});
  const latest = useRef(selected);
  latest.current = selected;
  const revision = state.status === "ready" ? state.revision : null;
  useEffect(() => { if (!saver.busy()) setPending(null); }, [revision, saver]);
  const select = (workspace: string, agent: AgentRef) => {
    if (state.status !== "ready" || latest.current[workspace]?.key === agent.key) return;
    const next = { ...latest.current, [workspace]: agent };
    latest.current = next;
    setPending(next);
    void saver.save({ selected: next }).then((saved) => {
      if (!saved) setPending(null);
    }).catch(() => setPending(null));
  };
  return <SelectionContext.Provider value={selected}>
    {agents.map((reference) => <Observe key={reference.key} reference={reference} active={active} select={select} newlyAdded={!initialKeys.current.has(reference.key)} />)}
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
