-- Durable, room-scoped warnings. A warning never changes voice/audio state.
create table if not exists phase3.room_moderation_warnings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  target_id uuid not null references auth.users(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  actor_role text not null check (actor_role in ('owner','moderator')),
  reason text not null check (char_length(btrim(reason)) between 5 and 500),
  created_at timestamptz not null default now()
);
create index if not exists room_moderation_warnings_room_time_idx
  on phase3.room_moderation_warnings(room_id,created_at desc);
create index if not exists room_moderation_warnings_target_idx
  on phase3.room_moderation_warnings(target_id,created_at desc);
create index if not exists room_moderation_warnings_actor_idx
  on phase3.room_moderation_warnings(actor_id,created_at desc);
alter table phase3.room_moderation_warnings enable row level security;
revoke all on phase3.room_moderation_warnings from public,anon,authenticated;
drop policy if exists room_moderation_warnings_no_client_access on phase3.room_moderation_warnings;
create policy room_moderation_warnings_no_client_access on phase3.room_moderation_warnings
  for all to public using(false) with check(false);

create table if not exists phase3.room_moderation_warning_requests (
  actor_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
alter table phase3.room_moderation_warning_requests enable row level security;
revoke all on phase3.room_moderation_warning_requests from public,anon,authenticated;
drop policy if exists room_moderation_warning_requests_no_client_access on phase3.room_moderation_warning_requests;
create policy room_moderation_warning_requests_no_client_access on phase3.room_moderation_warning_requests
  for all to public using(false) with check(false);

create or replace function public.phase2_room_warn_member(
  p_room_id uuid,
  p_target uuid,
  p_reason text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid:=phase3.actor();
  room_owner uuid;
  is_owner boolean;
  is_moderator boolean;
  is_target_moderator boolean;
  normalized_reason text:=btrim(coalesce(p_reason,''));
  payload jsonb;
  prior phase3.room_moderation_warning_requests%rowtype;
  warning_id uuid;
  warning_count bigint;
  answer jsonb;
begin
  if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501';
  end if;
  if p_room_id is null or p_target is null or p_request_id is null
     or char_length(normalized_reason) not between 5 and 500 then
    raise exception 'INVALID_ROOM_WARNING' using errcode='22023';
  end if;
  select r.owner_id into room_owner from public.rooms r where r.id=p_room_id for update;
  if not found then raise exception 'ROOM_UNAVAILABLE' using errcode='42501'; end if;
  is_owner:=v_actor=room_owner;
  is_moderator:=exists(select 1 from public.room_moderators m
    where m.room_id=p_room_id and m.user_id=v_actor);
  if not is_owner and not is_moderator then
    raise exception 'ROOM_MODERATOR_REQUIRED' using errcode='42501';
  end if;
  if p_target=room_owner or p_target=v_actor then
    raise exception 'CANNOT_WARN_OWNER_OR_SELF' using errcode='42501';
  end if;
  is_target_moderator:=exists(select 1 from public.room_moderators m
    where m.room_id=p_room_id and m.user_id=p_target);
  if is_target_moderator and not is_owner then
    raise exception 'ONLY_OWNER_CAN_WARN_ROOM_MODERATOR' using errcode='42501';
  end if;
  if not exists(select 1 from public.room_members m
    where m.room_id=p_room_id and m.user_id=p_target) then
    raise exception 'ROOM_MEMBER_REQUIRED' using errcode='42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(hashtextextended(v_actor::text||p_request_id::text,0));
  payload:=jsonb_build_object('sha256',encode(sha256(convert_to(jsonb_build_object(
    'room',p_room_id,'target',p_target,'reason',normalized_reason)::text,'UTF8')),'hex'));
  select * into prior from phase3.room_moderation_warning_requests r
    where r.actor_id=v_actor and r.request_id=p_request_id;
  if found then
    if prior.payload<>payload then raise exception 'WARNING_IDEMPOTENCY_CONFLICT'; end if;
    return prior.result;
  end if;
  if (select count(*) from phase3.room_moderation_warning_requests r
    where r.actor_id=v_actor and r.created_at>now()-interval '1 minute')>=15 then
    raise exception 'WARNING_RATE_LIMITED';
  end if;
  insert into phase3.room_moderation_warnings(room_id,target_id,actor_id,actor_role,reason)
    values(p_room_id,p_target,v_actor,case when is_owner then 'owner' else 'moderator' end,normalized_reason)
    returning id into warning_id;
  select count(*) into warning_count from phase3.room_moderation_warnings w
    where w.room_id=p_room_id and w.target_id=p_target;
  answer:=jsonb_build_object('warningId',warning_id,'roomId',p_room_id,
    'targetId',p_target,'warningCount',warning_count,'scope','room_only');
  insert into phase3.room_moderation_warning_requests(actor_id,request_id,payload,result)
    values(v_actor,p_request_id,payload,answer);
  insert into public.security_audit(actor_id,action,details)
    values(v_actor,'room_moderation_warn',jsonb_build_object(
      'warningId',warning_id,'roomId',p_room_id,'targetId',p_target,
      'actorRole',case when is_owner then 'owner' else 'moderator' end));
  return answer;
end
$function$;
revoke all on function public.phase2_room_warn_member(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.phase2_room_warn_member(uuid,uuid,text,uuid) to authenticated;
