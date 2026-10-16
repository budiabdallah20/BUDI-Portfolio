"use client";

import { useCallback, useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Login, { isAuthed } from "./Login";
import AdminLoadingScreen from "./AdminLoadingScreen";
import GlobalSplash from "./GlobalSplash";
import WorkspaceHub from "./WorkspaceHub";
import WorkspaceWelcome from "./WorkspaceWelcome";
import { setStoreNamespace } from "./store";
import {
  builtinWorkspace,
  hasSeenWelcome,
  lastWorkspaceId,
  clearLastWorkspace,
  loadWorkspaces,
  markWelcomeSeen,
  recordOpen,
  type Workspace,
} from "./workspaces";

type View =
  | { name: "gate" }
  | { name: "hub" }
  | { name: "boot"; ws: Workspace }
  | { name: "app"; ws: Workspace };

/** Dev StrictMode remounts effects — the banner must still print once. */
let adminBannerShown = false;

/**
 * /admin root — new flow:
 *   global splash → control-center gate (server-verified) → hub (dashboards) →
 *   dashboard loader → console.
 * Each dashboard owns its isolated local DB namespace (`budi-admin-db__<id>`).
 */
export default function AdminApp(): React.JSX.Element {
  const [splash, setSplash] = useState(true);
  const [list, setList] = useState<Workspace[]>(() => [builtinWorkspace()]);
  const [view, setView] = useState<View>({ name: "gate" });
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    setList(loadWorkspaces());
  }, []);

  /** Chic devtools hello — static strings only, zero secrets. Confirms the
   *  error trap is armed: any runtime error surfaces here AND as a toast. */
  useEffect(() => {
    if (adminBannerShown) return;
    adminBannerShown = true;
    // Production console stays silent — devtools hello is dev-only.
    if (process.env.NODE_ENV === "production") return;
    try {
      const secure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      console.log(
        "%cBUDI OS %ccontrol center",
        "font-black font-size:20px; letter-spacing:4px; color:#ff3d00",
        "font-bold font-size:12px; color:#d7fd44",
      );
      console.log(
        "%cWelcome back, chief — every save rebuilds the live site in seconds.",
        "font-size:12px; color:#a1a1aa",
      );
      console.log(
        `%cTrap armed: runtime errors toast + log here · transport ${secure ? "secure" : "NOT secure — serve over https"}`,
        `font-size:12px; color:${secure ? "#34d399" : "#fbbf24"}`,
      );
    } catch {
      /* console blocked */
    }
  }, []);

  const openWorkspace = useCallback(
    (ws: Workspace): void => {
      if (ws.kind === "external" && ws.dashboardUrl !== "") {
        setList(recordOpen(ws.id));
        try {
          window.open(ws.dashboardUrl, "_blank", "noopener,noreferrer");
        } catch {
          /* popup blocked */
        }
        return;
      }
      setStoreNamespace(ws.id);
      setList(recordOpen(ws.id));
      setView({ name: "boot", ws });
    },
    [],
  );

  const finishSplash = useCallback((): void => {
    setSplash(false);
    setList(loadWorkspaces());
    if (!isAuthed()) {
      setView({ name: "gate" });
      return;
    }
    const last = lastWorkspaceId();
    const fresh = loadWorkspaces();
    const target = last ? fresh.find((w) => w.id === last) : undefined;
    if (target && target.kind !== "external") {
      openWorkspace(target);
      return;
    }
    setView({ name: "hub" });
  }, [openWorkspace]);

  const enterApp = useCallback((ws: Workspace): void => {
    setWelcome(ws.id !== builtinWorkspace().id && !hasSeenWelcome(ws.id));
    setView({ name: "app", ws });
  }, []);

  const enterBootDone = useCallback(
    (ws: Workspace): void => {
      enterApp(ws);
    },
    [enterApp],
  );

  const handleAuthed = useCallback((): void => {
    setList(loadWorkspaces());
    const last = lastWorkspaceId();
    const fresh = loadWorkspaces();
    const target = last ? fresh.find((w) => w.id === last) : undefined;
    if (target && target.kind !== "external") {
      openWorkspace(target);
      return;
    }
    setView({ name: "hub" });
  }, [openWorkspace]);

  const goHub = useCallback((): void => {
    setView({ name: "hub" });
  }, []);

  const quickOpen = useCallback(
    (id: string): void => {
      const target = loadWorkspaces().find((w) => w.id === id);
      if (target) openWorkspace(target);
    },
    [openWorkspace],
  );

  const handleLogout = useCallback((): void => {
    setView({ name: "gate" });
  }, []);

  if (splash) {
    return <GlobalSplash workspaces={list.length} onComplete={finishSplash} />;
  }

  if (view.name === "gate") {
    return <Login onAuthed={handleAuthed} />;
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
  const isMain = ws.id === builtinWorkspace().id;

  return (
    <>
      <Dashboard
        key={ws.id}
        workspaceId={ws.id}
        workspaceName={isMain ? undefined : ws.name}
        workspaceLogo={isMain ? undefined : ws.logo || undefined}
        workspaceTheme={isMain ? undefined : ws.theme}
        cloudSync={isMain}
        onSwitchAccount={goHub}
        workspaces={list}
        onQuickOpen={quickOpen}
        isMainConsole={isMain}
        workspaceMotto={
          ws.mottoAr !== "" || ws.mottoEn !== ""
            ? { ar: ws.mottoAr, en: ws.mottoEn, ref: ws.mottoRef }
            : null
        }
        onLogout={handleLogout}
      />
      {view.name === "app" && welcome && (
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
      {view.name === "boot" && <AdminLoadingScreen onComplete={() => enterBootDone(ws)} />}
    </>
  );
}
