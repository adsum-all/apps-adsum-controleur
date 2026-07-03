// Offline-first check-in queue. Each scan or manual entry is stored locally and
// survives a reload or a loss of network. Pending items are pushed to the API
// when connectivity is available, so the controller never blocks at the door.
import { ApiError, checkin, checkinManuel } from "./api.js";

const KEY = "adsum.controleur.queue";

export type QueueStatus = "pending" | "synced" | "rejected";

export interface QueueItem {
  id: string;
  kind: "qr" | "manual";
  qrToken?: string;
  membreId?: string;
  evenementId: string;
  label: string;
  matricule?: string;
  ts: number;
  status: QueueStatus;
  error?: string;
}

export function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items.slice(-500)));
}

export function enqueue(item: Omit<QueueItem, "id" | "ts" | "status">): QueueItem[] {
  const items = loadQueue();
  items.push({ ...item, id: crypto.randomUUID(), ts: Date.now(), status: "pending" });
  saveQueue(items);
  return items;
}

export function pendingCount(items: QueueItem[] = loadQueue()): number {
  return items.filter((i) => i.status === "pending").length;
}

export interface SyncOutcome {
  synced: number;
  rejected: number;
  remaining: number;
}

export async function syncQueue(token: string): Promise<SyncOutcome> {
  const items = loadQueue();
  let synced = 0;
  let rejected = 0;
  for (const item of items) {
    if (item.status !== "pending") continue;
    try {
      if (item.kind === "qr" && item.qrToken) {
        await checkin(token, item.qrToken, item.evenementId);
      } else if (item.kind === "manual" && item.membreId) {
        await checkinManuel(token, item.membreId, item.evenementId);
      } else {
        item.status = "rejected";
        item.error = "entrée incomplète";
        rejected += 1;
        continue;
      }
      item.status = "synced";
      synced += 1;
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        item.status = "rejected";
        item.error = err.message;
        rejected += 1;
      }
      // network or auth errors leave the item pending for the next sync
    }
  }
  saveQueue(items);
  return { synced, rejected, remaining: pendingCount(items) };
}

export function clearSynced(): QueueItem[] {
  const items = loadQueue().filter((i) => i.status !== "synced");
  saveQueue(items);
  return items;
}
