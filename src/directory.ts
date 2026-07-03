// Local cache of the member directory, fetched once when online so manual entry
// and member names keep working offline (as the pairing screen promises).
import type { DirectoryMember } from "./api.js";

const KEY = "adsum.controleur.directory";

export function cacheDirectory(members: DirectoryMember[]): void {
  localStorage.setItem(KEY, JSON.stringify(members));
}

export function loadCachedDirectory(): DirectoryMember[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DirectoryMember[]) : [];
  } catch {
    return [];
  }
}

export function findById(id: string): DirectoryMember | undefined {
  return loadCachedDirectory().find((m) => m.id === id);
}

export function searchDirectory(q: string, limit = 20): DirectoryMember[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return loadCachedDirectory()
    .filter((m) => {
      const haystack = `${m.matricule} ${m.nom ?? ""} ${m.prenoms ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    })
    .slice(0, limit);
}
