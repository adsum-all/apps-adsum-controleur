import { useState } from "react";

import { clearSynced, loadQueue, type QueueItem, pendingCount, syncQueue } from "../queue.js";
import { formatClock } from "../format.js";

interface SyncQueueProps {
  token: string;
  online: boolean;
  onQueueChange: () => void;
}

export function SyncQueue({ token, online, onQueueChange }: SyncQueueProps): JSX.Element {
  const [items, setItems] = useState<QueueItem[]>(loadQueue());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function sync(): Promise<void> {
    setBusy(true);
    setNote(null);
    const outcome = await syncQueue(token);
    setItems(loadQueue());
    onQueueChange();
    setBusy(false);
    setNote(`${outcome.synced} synchronisé(s), ${outcome.rejected} rejeté(s), ${outcome.remaining} en attente.`);
  }

  function purge(): void {
    setItems(clearSynced());
    onQueueChange();
  }

  return (
    <div className="screen">
      <h1 className="screen-title">File de synchronisation</h1>
      <p className="screen-sub">{pendingCount(items)} pointage(s) conservé(s) localement.</p>
      {note && <p className="banner banner-ok">{note}</p>}
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => void sync()} disabled={busy || !online}>
          {busy ? "Synchronisation..." : online ? "Synchroniser maintenant" : "Hors-ligne"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={purge}>
          Purger les synchronisés
        </button>
      </div>
      <ul className="list">
        {items
          .slice()
          .reverse()
          .map((i) => (
            <li key={i.id} className="queue-item">
              <div className="event-main">
                <strong>{i.label}</strong>
                <span className="muted">
                  {i.matricule ?? "-"} . {formatClock(i.ts)} . {i.kind === "manual" ? "manuel" : "QR"}
                </span>
              </div>
              <span className={`badge ${badgeClass(i.status)}`}>{statusLabel(i.status)}</span>
            </li>
          ))}
      </ul>
      {items.length === 0 && <p className="muted">Aucun pointage en file.</p>}
    </div>
  );
}

function statusLabel(status: QueueItem["status"]): string {
  return status === "synced" ? "synchronisé" : status === "rejected" ? "rejeté" : "en attente";
}

function badgeClass(status: QueueItem["status"]): string {
  return status === "synced" ? "badge-ok" : status === "rejected" ? "badge-bad" : "badge-mut";
}
