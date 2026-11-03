import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const validUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

async function digest(secret: string, userId: string, sessionId: string, code: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId + ":" + sessionId + ":" + code));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return reply({ status: "method_not_allowed" }, 405);
  const apiUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const secret = Deno.env.get("OTP_HMAC_SECRET");
  if (!apiUrl || !serviceKey || !secret || secret.length < 32) {
    return reply({ status: "not_configured" }, 503);
  }
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") || "")?.[1];
  if (!token) return reply({ status: "unauthorized" }, 401);
  let payload: unknown;
  try { payload = await req.json(); } catch { return reply({ status: "invalid" }, 400); }
  const code = (payload && typeof payload === "object" && "code" in payload) ? (payload as { code?: unknown }).code : undefined;
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return reply({ status: "invalid" }, 400);

  try {
    const admin = createClient(apiUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const [identity, jwtResult] = await Promise.all([admin.auth.getUser(token), admin.auth.getClaims(token)]);
    const user = identity.data.user;
    const claims = jwtResult.data?.claims;
    if (identity.error || jwtResult.error || !user || !claims ||
        claims.sub !== user.id || !validUuid(claims.session_id) ||
        !user.email || !user.email_confirmed_at ||
        !((user.app_metadata?.providers || []).includes("google") || user.app_metadata?.provider === "google")) {
      return reply({ status: "unauthorized" }, 401);
    }
    const codeDigest = await digest(secret, user.id, claims.session_id, code);
    const verified = await admin.rpc("otp_verify_challenge", {
      p_user_id: user.id, p_session_id: claims.session_id, p_code_digest: codeDigest,
    });
    if (verified.error) return reply({ status: "server_unavailable" }, 503);
    const state = verified.data;
    if (!state || !["verified", "invalid", "expired", "locked"].includes(state.status)) {
      return reply({ status: "unauthorized" }, 401);
    }
    return reply({ status: state.status, remainingAttempts: state.remainingAttempts });
  } catch {
    return reply({ status: "server_unavailable" }, 503);
  }
});
