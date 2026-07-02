// Persisted controller session. The JWT is kept in localStorage so a page
// reload (or an iOS PWA relaunch) does not force the controller to sign in
// again at the door. Access is wrapped in try/catch to stay safe in private
// browsing mode, where localStorage may throw.

const KEY = "adsum.ctrl.token";

export function loadToken(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // Private mode or storage full: keep working in memory only.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
