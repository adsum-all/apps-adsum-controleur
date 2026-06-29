// Offline verification of an ADSUM1 member QR token, so the controller can
// validate a member at the door without network access. The token format is
// ADSUM1.<payload_b64url>.<signature_b64url>, the signature being Ed25519 over
// the ASCII bytes "ADSUM1.<payload_b64url>". The public key is published (safe
// to embed) and configurable through VITE_QR_PUBLIC_KEY.
import { ed25519 } from "@noble/curves/ed25519";

const PUBLIC_KEY_B64 =
  (import.meta.env.VITE_QR_PUBLIC_KEY as string | undefined) ??
  "Smqgpo8kDtAdNmu8E1UNISeAVpLmH-hKAXWj-5hUnO8";

export interface QrVerification {
  valid: boolean;
  reason?: string;
  membreId?: string;
  expiresAt?: number;
}

function b64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(value: string): Record<string, unknown> {
  const text = new TextDecoder().decode(b64urlToBytes(value));
  return JSON.parse(text) as Record<string, unknown>;
}

export function verifyQrToken(
  token: string,
  now: number = Date.now(),
  publicKeyB64: string = PUBLIC_KEY_B64,
): QrVerification {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "ADSUM1") {
    return { valid: false, reason: "format inconnu" };
  }
  const [, payloadB64, sigB64] = parts as [string, string, string];
  try {
    const message = new TextEncoder().encode(`ADSUM1.${payloadB64}`);
    const signature = b64urlToBytes(sigB64);
    const publicKey = b64urlToBytes(publicKeyB64);
    if (!ed25519.verify(signature, message, publicKey)) {
      return { valid: false, reason: "signature invalide" };
    }
    const payload = decodeJson(payloadB64);
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    const membreId = typeof payload.m === "string" ? payload.m : undefined;
    if (exp * 1000 < now) {
      return { valid: false, reason: "jeton expire", membreId, expiresAt: exp };
    }
    return { valid: true, membreId, expiresAt: exp };
  } catch {
    return { valid: false, reason: "jeton illisible" };
  }
}

export function qrPublicKey(): string {
  return PUBLIC_KEY_B64;
}
