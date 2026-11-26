import type { PluginSidebarViewProps } from "@getpaseo/plugin/client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

type Target = { measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void };
type Tooltip = { path: string; top: number };
const Context = createContext({
  show: (_target: Target | null, _path: string) => {},
  hide: () => {},
});

/** An overlay inside the sidebar, outside ScrollView clipping, using native measurements only. */
export function WorkspaceTooltipProvider({ theme, children }: {
  theme: PluginSidebarViewProps["theme"]; children: ReactNode;
}) {
  const root = useRef<View>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const hide = useCallback(() => {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setTooltip(null);
  }, []);
  useEffect(() => () => {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const show = useCallback((target: Target | null, path: string) => {
    hide();
    if (!target || !path) return;
    const token = generation.current;
    timer.current = setTimeout(() => {
      target.measureInWindow((_x, y, _width, height) => {
        root.current?.measureInWindow((_rx, ry, _rw, rh) => {
          if (generation.current !== token) return;
          // Prefer above the row when little room remains below it.
          const below = y - ry + height + 4;
          const top = below + 96 <= rh ? below : Math.max(4, y - ry - 100);
          setTooltip({ path, top });
        });
      });
    }, 350);
  }, [hide]);
  const value = useMemo(() => ({ show, hide }), [show, hide]);
  return <Context.Provider value={value}>
    <View ref={root} collapsable={false} style={{ flex: 1 }}>
      {children}
      {tooltip ? <View pointerEvents="none" style={{
        position: "absolute", top: tooltip.top, left: 8, right: 8, zIndex: 100,
        padding: 8, borderRadius: 6,
        borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface2,
      }}>
        <Text selectable={false} accessibilityRole="text" style={{
          color: theme.colors.foreground, fontSize: 11, lineHeight: 15,
        }}>{tooltip.path}</Text>
      </View> : null}
    </View>
  </Context.Provider>;
}

export const useWorkspaceTooltip = () => useContext(Context);

export function useWorkspacePathHover(path: string | undefined) {
  const target = useRef<View>(null);
  const { show, hide } = useWorkspaceTooltip();
  useEffect(() => hide, [hide, path]);
  return { ref: target, onHoverIn: () => show(target.current, path ?? ""), onHoverOut: hide };
}
