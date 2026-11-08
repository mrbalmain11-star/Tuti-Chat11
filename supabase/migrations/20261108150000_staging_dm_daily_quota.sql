-- Staging DM policy: mutual follows may message normally; otherwise allow
-- three accepted messages per sender/recipient pair per UTC day.
-- The per-pair advisory lock makes the quota safe under concurrent sends.
create or replace function public.staging_send_dm(p_to uuid, p_text text, p_nonce uuid)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_from uuid := (select auth.uid());
  v_id bigint;
  v_mutual boolean;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  v_sent_today bigint;
begin
  if not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode = '42501';
  end if;
  if v_from is null then raise exception 'Login required'; end if;
  if p_to is null or p_to = v_from or p_nonce is null then
    raise exception 'Invalid recipient or request';
  end if;
  if p_text is null or length(trim(p_text)) not between 1 and 2000 then
    raise exception 'Invalid text';
  end if;
  if not exists (select 1 from public.profiles where id = p_to) then
    raise exception 'Recipient not found';
  end if;
  if exists (
    select 1 from public.dm_blocks
    where (blocker_id = v_from and blocked_id = p_to)
       or (blocker_id = p_to and blocked_id = v_from)
  ) then raise exception 'Blocked'; end if;

  -- Retries with the original nonce return the accepted message and do not
  -- consume an additional daily slot.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_from::text || ':' || p_to::text, 0)
  );
  select id into v_id from public.direct_messages
  where sender_id = v_from and request_id = p_nonce;
  if v_id is not null then return v_id; end if;

  select exists (
    select 1 from public.social_follows f
    where f.follower_id = v_from and f.followed_id = p_to
  ) and exists (
    select 1 from public.social_follows f
    where f.follower_id = p_to and f.followed_id = v_from
  ) into v_mutual;

  if not v_mutual then
    select count(*) into v_sent_today from public.direct_messages
    where sender_id = v_from and recipient_id = p_to and created_at >= v_day_start;
    if v_sent_today >= 3 then
      raise exception 'DAILY_DM_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  insert into public.direct_messages(sender_id, recipient_id, body, request_id)
  values (v_from, p_to, trim(p_text), p_nonce)
  returning id into v_id;
  return v_id;
end;
$function$;

revoke all on function public.staging_send_dm(uuid, text, uuid) from public, anon;
grant execute on function public.staging_send_dm(uuid, text, uuid) to authenticated;
