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

function sixDigitCode(): string {
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= 4294000000);
  return String(value[0] % 1000000).padStart(6, "0");
}
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
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("OTP_FROM_EMAIL");
  const hmacSecret = Deno.env.get("OTP_HMAC_SECRET");
  if (!apiUrl || !serviceKey || !resendKey || !fromEmail || !hmacSecret || hmacSecret.length < 32) {
    return reply({ status: "not_configured" }, 503);
  }

  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") || "")?.[1];
  if (!token) return reply({ status: "unauthorized" }, 401);

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
    const sessionId = claims.session_id;
    const already = await admin.rpc("otp_is_verified_for_session", {
      p_user_id: user.id, p_session_id: sessionId,
    });
    if (already.error) return reply({ status: "server_unavailable" }, 503);
    if (already.data === true) return reply({ status: "already_verified" });

    const code = sixDigitCode();
    const codeDigest = await digest(hmacSecret, user.id, sessionId, code);
    const issued = await admin.rpc("otp_issue_challenge", {
      p_user_id: user.id, p_session_id: sessionId, p_code_digest: codeDigest,
    });
    if (issued.error) return reply({ status: "server_unavailable" }, 503);
    if (issued.data?.status === "rate_limited") {
      return reply({ status: "rate_limited", retryAfterSeconds: issued.data.retryAfterSeconds ?? 60 });
    }
    if (issued.data?.status !== "sent") return reply({ status: "unauthorized" }, 401);

    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + resendKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [user.email],
        subject: "TotiChat - رمز تأكيد تسجيل الدخول",
        text: "رمز تأكيد الدخول إلى TotiChat: " + code + "\nمدة صلاحية الرمز 5 دقائق. إذا لم تطلب هذا الرمز فتجاهل الرسالة.",
      }),
    });
    if (!send.ok) return reply({ status: "delivery_failed" }, 502);
    return reply({ status: "sent", retryAfterSeconds: 60, expiresInSeconds: 300 });
  } catch {
    return reply({ status: "server_unavailable" }, 503);
  }
});
