// Thin client for the ADSUM API used by the controller scan app. The base URL is
// configurable so the app can point at the deployed API
// (https://adsum-api.vercel.app) or a local one.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

export interface ControlEvent {
  id: string;
  titre: string;
  volet: string;
  debut: string;
  fin: string | null;
  lieu: string | null;
  session_ouverte: boolean;
}

export interface CheckinMember {
  id: string;
  matricule: string;
  nom: string | null;
  prenoms: string | null;
  photo_url?: string | null;
  /** Confirmed honorific prefix (Berger, Coordinatrice...), resolved by gender. */
  titre?: string | null;
}

export interface CheckinResult {
  deja_present: boolean;
  membre: CheckinMember;
  evenement_id: string;
  arrivee: string | null;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string | null;
  matricule?: string | null;
  nom?: string | null;
  photo_url?: string | null;
}

export interface DirectoryMember {
  id: string;
  matricule: string;
  nom: string | null;
  prenoms: string | null;
  commission: string | null;
  statut: string;
  /** Confirmed honorific prefix (Berger, Coordinatrice...), resolved by gender. */
  titre?: string | null;
}

export interface CheckoutResult {
  membre: CheckinMember;
  evenement_id: string;
  depart: string | null;
  deja_sorti: boolean;
}

// Discriminated error so the UI can react to the missing controller endpoints
// (404, built in parallel by the backend) with a clear message rather than a
// generic failure.
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get notDeployed(): boolean {
    return this.status === 404;
  }
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function readDetail(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { detail?: unknown; reason?: unknown };
    const raw = data.detail ?? data.reason;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0] as { msg?: unknown };
      if (typeof first.msg === "string") return first.msg;
    }
    return null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError(
      res.status === 401 ? "Identifiants invalides" : "Service indisponible",
      res.status,
    );
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function getControlEvents(token: string): Promise<ControlEvent[]> {
  const res = await fetch(`${BASE}/api/v1/controle/evenements`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError("Module de contrôle indisponible sur l'API.", 404);
    }
    throw new ApiError(
      res.status === 401 ? "Session expirée" : "Événements indisponibles",
      res.status,
    );
  }
  return (await res.json()) as ControlEvent[];
}

export async function checkin(
  token: string,
  qrToken: string,
  evenementId: string,
): Promise<CheckinResult> {
  const res = await fetch(`${BASE}/api/v1/controle/checkin`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ token: qrToken, evenement_id: evenementId }),
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError("Module de contrôle indisponible sur l'API.", 404);
    }
    if (res.status === 422) {
      throw new ApiError((await readDetail(res)) ?? "QR invalide ou expiré.", 422);
    }
    throw new ApiError(
      res.status === 401 ? "Session expirée" : "Pointage impossible.",
      res.status,
    );
  }
  return (await res.json()) as CheckinResult;
}

export async function verify(token: string, qrToken: string): Promise<VerifyResult> {
  const res = await fetch(`${BASE}/api/v1/controle/verify`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ token: qrToken }),
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError("Module de contrôle indisponible sur l'API.", 404);
    }
    throw new ApiError(
      res.status === 401 ? "Session expirée" : "Vérification impossible.",
      res.status,
    );
  }
  return (await res.json()) as VerifyResult;
}

export async function getDirectory(token: string, q?: string): Promise<DirectoryMember[]> {
  const url = new URL(`${BASE}/api/v1/controle/membres`);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString(), { headers: authHeaders(token) });
  if (!res.ok) {
    if (res.status === 404) throw new ApiError("Module de contrôle indisponible sur l'API.", 404);
    throw new ApiError(res.status === 401 ? "Session expirée" : "Annuaire indisponible", res.status);
  }
  return (await res.json()) as DirectoryMember[];
}

export async function checkinManuel(
  token: string,
  membreId: string,
  evenementId: string,
): Promise<CheckinResult> {
  const res = await fetch(`${BASE}/api/v1/controle/checkin-manuel`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ membre_id: membreId, evenement_id: evenementId }),
  });
  if (!res.ok) {
    if (res.status === 404) throw new ApiError("Module de contrôle indisponible sur l'API.", 404);
    throw new ApiError(res.status === 401 ? "Session expirée" : "Pointage manuel impossible.", res.status);
  }
  return (await res.json()) as CheckinResult;
}

export async function checkout(
  token: string,
  qrToken: string,
  evenementId: string,
): Promise<CheckoutResult> {
  const res = await fetch(`${BASE}/api/v1/controle/checkout`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ token: qrToken, evenement_id: evenementId }),
  });
  if (!res.ok) {
    if (res.status === 404) throw new ApiError("Module de contrôle indisponible sur l'API.", 404);
    if (res.status === 422) throw new ApiError((await readDetail(res)) ?? "QR invalide.", 422);
    throw new ApiError(res.status === 401 ? "Session expirée" : "Sortie impossible.", res.status);
  }
  return (await res.json()) as CheckoutResult;
}

export function apiBaseUrl(): string {
  return BASE;
}
