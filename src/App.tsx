import { useCallback, useEffect, useState } from "react";

import { type ControlEvent, ApiError, getControlEvents, getDirectory } from "./api.js";
import { Login } from "./components/Login.js";
import { EventPicker } from "./components/EventPicker.js";
import { ManualEntry } from "./components/ManualEntry.js";
import { Scanner } from "./components/Scanner.js";
import { SyncQueue } from "./components/SyncQueue.js";
import { cacheDirectory } from "./directory.js";
import { pendingCount } from "./queue.js";

type Tab = "scan" | "manual" | "queue";

export function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<ControlEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<ControlEvent | null>(null);
  const [tab, setTab] = useState<Tab>("scan");
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<number>(pendingCount());

  useEffect(() => {
    const up = (): void => setOnline(true);
    const down = (): void => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const refreshQueue = useCallback(() => setQueue(pendingCount()), []);

  const onAuth = useCallback(async (jwt: string) => {
    setToken(jwt);
    setLoading(true);
    setError(null);
    try {
      const [evts] = await Promise.all([
        getControlEvents(jwt),
        getDirectory(jwt).then(cacheDirectory).catch(() => undefined),
      ]);
      setEvents(evts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur reseau");
    } finally {
      setLoading(false);
    }
  }, []);

  function logout(): void {
    setToken(null);
    setEvent(null);
    setEvents([]);
  }

  if (!token) {
    return (
      <Shell>
        <Login onAuth={onAuth} />
      </Shell>
    );
  }

  if (!event) {
    return (
      <Shell>
        <EventPicker events={events} loading={loading} error={error} onPick={setEvent} />
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="topbar">
        <button type="button" className="link" onClick={() => setEvent(null)}>
          Changer
        </button>
        <span className="topbar-title">{event.titre}</span>
        <button type="button" className="link" onClick={logout}>
          Quitter
        </button>
      </header>
      <main className="content">
        {tab === "scan" && <Scanner token={token} event={event} online={online} onQueueChange={refreshQueue} />}
        {tab === "manual" && (
          <ManualEntry token={token} event={event} online={online} onQueueChange={refreshQueue} />
        )}
        {tab === "queue" && <SyncQueue token={token} online={online} onQueueChange={refreshQueue} />}
      </main>
      <nav className="tabbar" aria-label="Navigation">
        <TabButton active={tab === "scan"} label="Scanner" glyph="[ ]" onClick={() => setTab("scan")} />
        <TabButton active={tab === "manual"} label="Manuel" glyph="A" onClick={() => setTab("manual")} />
        <TabButton
          active={tab === "queue"}
          label="File"
          glyph="#"
          badge={queue > 0 ? queue : undefined}
          onClick={() => setTab("queue")}
        />
      </nav>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="app">
      <div className="app-inner">{children}</div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  label: string;
  glyph: string;
  badge?: number;
  onClick: () => void;
}

function TabButton({ active, label, glyph, badge, onClick }: TabButtonProps): JSX.Element {
  return (
    <button type="button" className={`tab ${active ? "tab-active" : ""}`} onClick={onClick} aria-current={active}>
      <span className="tab-glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="tab-label">{label}</span>
      {badge !== undefined && <span className="tab-badge">{badge}</span>}
    </button>
  );
}
