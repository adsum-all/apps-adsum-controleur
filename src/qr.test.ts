import { ed25519 } from "@noble/curves/ed25519";
import { describe, expect, it } from "vitest";

import { verifyQrToken } from "./qr.js";

function b64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeToken(privateKey: Uint8Array, payload: object): string {
  const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const message = new TextEncoder().encode(`ADSUM1.${payloadB64}`);
  const sig = ed25519.sign(message, privateKey);
  return `ADSUM1.${payloadB64}.${b64url(sig)}`;
}

describe("verifyQrToken", () => {
  const priv = ed25519.utils.randomPrivateKey();
  const pub = b64url(ed25519.getPublicKey(priv));
  const now = 1_800_000_000_000;

  it("accepts a valid, unexpired token", () => {
    const token = makeToken(priv, { v: 1, m: "member-1", iat: now / 1000, exp: now / 1000 + 90, kv: 1 });
    const result = verifyQrToken(token, now, pub);
    expect(result.valid).toBe(true);
    expect(result.membreId).toBe("member-1");
  });

  it("rejects an expired token", () => {
    const token = makeToken(priv, { v: 1, m: "member-1", iat: now / 1000 - 200, exp: now / 1000 - 100, kv: 1 });
    expect(verifyQrToken(token, now, pub).valid).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const other = ed25519.utils.randomPrivateKey();
    const token = makeToken(other, { v: 1, m: "x", iat: now / 1000, exp: now / 1000 + 90, kv: 1 });
    expect(verifyQrToken(token, now, pub).valid).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(verifyQrToken("not-a-token", now, pub).valid).toBe(false);
    expect(verifyQrToken("ADSUM1.only-two", now, pub).valid).toBe(false);
  });
});
