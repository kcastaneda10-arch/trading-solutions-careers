/**
 * CSRF-safe OAuth state without cookies.
 *
 * El state se firma con HMAC-SHA256 usando LINKEDIN_CLIENT_SECRET.
 * Así no dependemos de que el navegador reenvíe cookies a través del
 * redirect cross-origin a LinkedIn (algunos navegadores bloquean).
 *
 * Formato: {nonce}.{timestamp_ms}.{hex_sig_64}
 */
import { createHmac, timingSafeEqual, randomUUID } from "crypto";

const MAX_AGE_MS = 10 * 60 * 1000; // 10 min

function getSecret(): string {
  const s = process.env.LINKEDIN_CLIENT_SECRET;
  if (!s) throw new Error("LINKEDIN_CLIENT_SECRET missing");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function issueState(): string {
  const nonce = randomUUID();
  const ts = String(Date.now());
  const payload = `${nonce}.${ts}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyState(state: string | null): {
  ok: boolean;
  reason?: "missing" | "malformed" | "bad_signature" | "expired";
} {
  if (!state) return { ok: false, reason: "missing" };
  const parts = state.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [nonce, ts, sig] = parts;
  if (!nonce || !ts || !sig) return { ok: false, reason: "malformed" };
  const payload = `${nonce}.${ts}`;
  const expected = sign(payload);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return { ok: false, reason: "bad_signature" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  const age = Date.now() - parseInt(ts, 10);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}
