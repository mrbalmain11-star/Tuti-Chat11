// Staging-only FCM HTTP v1 sender. Deployment requires FCM_SERVICE_ACCOUNT_JSON,
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server-side secrets.
// Never invoke with a service-role key from a client.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.9.6';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const serviceAccountRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
  if (!url || !serviceKey || !serviceAccountRaw) return json({ error: 'Push not configured' }, 503);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(authHeader.slice(7));
  if (userError || !user) return json({ error: 'Unauthorized' }, 401);

  let messageId: string;
  try {
    const body = await request.json();
    messageId = String(body?.messageId ?? '');
  } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!/^\d{1,18}$/.test(messageId)) return json({ error: 'Invalid message ID' }, 400);

  // A sender may only request notification for a message they actually sent.
  const { data: message, error: messageError } = await admin.from('direct_messages')
    .select('id,sender_id,recipient_id,created_at').eq('id', messageId).maybeSingle();
  if (messageError || !message || message.sender_id !== user.id) return json({ error: 'Not found' }, 404);
  // Prevent old-message replay. A durable deduplication/outbox is still required
  // before enabling this endpoint for public clients.
  if (Math.abs(Date.now() - new Date(message.created_at).getTime()) > 60_000)
    return json({ error: 'Message is too old' }, 409);

  const { data: devices, error: deviceError } = await admin.from('push_device_tokens')
    .select('token').eq('user_id', message.recipient_id).limit(20);
  if (deviceError) return json({ error: 'Device lookup failed' }, 500);
  if (!devices?.length) return json({ sent: 0 });

  let account: { client_email: string; private_key: string; project_id: string };
  try { account = JSON.parse(serviceAccountRaw); } catch { return json({ error: 'Invalid server configuration' }, 503); }
  if (account.project_id !== 'totichatpro') return json({ error: 'Firebase project mismatch' }, 503);

  // Atomically claim the message before sending. Unique primary key rejects
  // concurrent and repeated requests, including attempts from multiple devices.
  const { error: claimError } = await admin.from('direct_message_push_claims')
    .insert({ message_id: message.id });
  if (claimError?.code === '23505') return json({ sent: 0, duplicate: true });
  if (claimError) return json({ error: 'Push claim failed' }, 500);

  const key = await importPKCS8(account.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.client_email).setSubject(account.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt().setExpirationTime('1h').sign(key);
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!tokenResponse.ok) return json({ error: 'FCM authorization failed' }, 502);
  const accessToken = (await tokenResponse.json()).access_token as string;
  let sent = 0;
  for (const device of devices) {
    const response = await fetch('https://fcm.googleapis.com/v1/projects/totichatpro/messages:send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { token: device.token, data: { type: 'direct_message' },
        android: { priority: 'high' } } }),
    });
    if (response.ok) sent++;
  }
  return json({ sent });
});
