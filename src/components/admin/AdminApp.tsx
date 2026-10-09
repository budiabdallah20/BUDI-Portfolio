"use client";

import { useCallback, useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";
import AdminLoadingScreen from "./AdminLoadingScreen";
import GlobalSplash from "./GlobalSplash";
import WorkspaceHub from "./WorkspaceHub";
import WorkspaceWelcome from "./WorkspaceWelcome";
import { setStoreNamespace } from "./store";
import {
  builtinWorkspace,
  hasSeenWelcome,
  isWorkspaceAuthed,
  lastWorkspaceId,
  clearLastWorkspace,
  loadWorkspaces,
  markWelcomeSeen,
  recordOpen,
  type Workspace,
} from "./workspaces";

type View =
  | { name: "hub" }
  | { name: "boot"; ws: Workspace }
  | { name: "login"; ws: Workspace }
  | { name: "app"; ws: Workspace };

/**
 * /admin root — BUDI OS flow:
 *   global splash → hub (or last-opened account) → per-workspace
 *   loader → PIN gate → isolated console.
 * Each workspace owns its TAB session + its local DB namespace
 * (`budi-admin-db__<id>`); switching accounts never mixes data.
 */
export default function AdminApp(): React.JSX.Element {
  const [splash, setSplash] = useState(true);
  // Lazy registry read is SSR-safe (loadWorkspaces guards window) and
  // gives the splash the real account count on first paint.
  const [list, setList] = useState<Workspace[]>(() => loadWorkspaces());
  const [view, setView] = useState<View>({ name: "hub" });
  const [booted, setBooted] = useState(false);
  /** First-open greeting for brand-new accounts (dashboard above it). */
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    setList(loadWorkspaces());
  }, []);

  const openWorkspace = useCallback(
    (ws: Workspace): void => {
      if (ws.kind === "external" && ws.dashboardUrl !== "") {
        setList(recordOpen(ws.id));
        try {
          window.open(ws.dashboardUrl, "_blank", "noopener,noreferrer");
        } catch {
          /* popup blocked — ledger still recorded */
        }
        return;
      }
      setStoreNamespace(ws.id);
      setBooted(false);
      setView({ name: "boot", ws });
    },
    [],
  );

  const finishSplash = useCallback((): void => {
    setSplash(false);
    const fresh = loadWorkspaces();
    setList(fresh);
    // Resume where you left off: last-opened account boots directly,
    // the hub is one tap away from its PIN screen.
    const last = lastWorkspaceId();
    const target = last ? fresh.find((w) => w.id === last) : undefined;
    if (target && (target.kind !== "external" || target.dashboardUrl === "")) {
      if (target.kind === "external") {
        setView({ name: "hub" });
        return;
      }
      openWorkspace(target);
      return;
    }
    setView({ name: "hub" });
  }, [openWorkspace]);

  const enterApp = useCallback((ws: Workspace): void => {
    setBooted(true);
    // Empty dashboards get a designed first moment — one greeting ever.
    setWelcome(ws.id !== builtinWorkspace().id && !hasSeenWelcome(ws.id));
    setView({ name: "app", ws });
  }, []);

  const enterBoot = useCallback(
    (ws: Workspace): void => {
      // Loader done → authed tabs skip the PIN, fresh tabs stop at the gate.
      if (isWorkspaceAuthed(ws.id)) {
        enterApp(ws);
        return;
      }
      setBooted(true);
      setView({ name: "login", ws });
    },
    [enterApp],
  );

  const handleAuthed = useCallback(
    (ws: Workspace): void => {
      setList(recordOpen(ws.id));
      enterApp(ws);
    },
    [enterApp],
  );

  const handleLogout = useCallback(
    (ws: Workspace): void => {
      // Locked to this workspace's PIN screen (session cleared by Dashboard).
      setBooted(true);
      setView({ name: "login", ws });
    },
    [],
  );

  const goHub = useCallback((): void => {
    setBooted(true);
    setView({ name: "hub" });
  }, []);

  if (splash) {
    return <GlobalSplash workspaces={list.length} onComplete={finishSplash} />;
  }

  if (view.name === "hub") {
    return (
      <WorkspaceHub
        list={list}
        onList={setList}
        onOpen={openWorkspace}
        onExitLast={() => {
          clearLastWorkspace();
        }}
      />
    );
  }

  const ws = view.ws;
  const authedView = view.name === "app";
  const showConsole = view.name === "boot" || authedView;
  const isMain = ws.id === builtinWorkspace().id;

  return (
    <>
      {showConsole && (
        <Dashboard
          key={ws.id}
          workspaceId={ws.id}
          workspaceName={isMain ? undefined : ws.name}
          workspaceLogo={isMain ? undefined : ws.logo || undefined}
          workspaceTheme={isMain ? undefined : ws.theme}
          cloudSync={isMain}
          onSwitchAccount={goHub}
          onLogout={() => handleLogout(ws)}
        />
      )}
      {authedView && welcome && (
        <WorkspaceWelcome
          name={ws.name}
          tagline={ws.tagline}
          logo={ws.logo}
          theme={ws.theme}
          onEnter={() => {
            markWelcomeSeen(ws.id);
            setWelcome(false);
          }}
        />
      )}
      {view.name === "boot" && (
        <AdminLoadingScreen
          word={ws.id === builtinWorkspace().id ? undefined : ws.name}
          subtitle={ws.id === builtinWorkspace().id ? undefined : ws.tagline}
          onComplete={() => enterBoot(ws)}
        />
      )}
      {view.name === "login" && (
        <Login
          workspace={{
            id: ws.id,
            name: ws.name,
            tagline: ws.tagline,
            logo: ws.logo,
            theme: ws.theme,
            pin: ws.pin,
            kind: ws.kind,
          }}
          onSwitchAccount={goHub}
          onAuthed={() => handleAuthed(ws)}
        />
      )}
    </>
  );
}
