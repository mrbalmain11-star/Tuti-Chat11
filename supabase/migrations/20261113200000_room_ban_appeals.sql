-- Private, owner-first appeals for room bans. Appeals are separate from the
-- active-ban row so lifting a ban never erases the appeal decision history.
create table if not exists phase3.room_ban_appeals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  target_id uuid not null references auth.users(id) on delete restrict,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  ban_version uuid not null,
  appeal_reason text not null check (char_length(btrim(appeal_reason)) between 10 and 1500),
  status text not null default 'pending_owner' check (status in (
    'pending_owner','owner_accepted','owner_rejected','escalated',
    'admin_accepted','admin_rejected'
  )),
  owner_decided_by uuid references auth.users(id) on delete restrict,
  owner_decision_reason text,
  owner_decided_at timestamptz,
  admin_decided_by uuid references auth.users(id) on delete restrict,
  admin_decision_reason text,
  admin_decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id,target_id,ban_version)
);
create index if not exists room_ban_appeals_owner_queue_idx
  on phase3.room_ban_appeals(room_id,status,created_at desc);
create index if not exists room_ban_appeals_submitter_idx
  on phase3.room_ban_appeals(submitted_by,created_at desc);
alter table phase3.room_ban_appeals enable row level security;
revoke all on phase3.room_ban_appeals from public,anon,authenticated;
drop policy if exists room_ban_appeals_no_client_access on phase3.room_ban_appeals;
create policy room_ban_appeals_no_client_access on phase3.room_ban_appeals
  for all to public using(false) with check(false);

create table if not exists phase3.room_ban_appeal_events (
  id bigint generated always as identity primary key,
  appeal_id uuid not null references phase3.room_ban_appeals(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('submit','owner_accept','owner_reject','escalate','admin_accept','admin_reject')),
  event_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table phase3.room_ban_appeal_events enable row level security;
revoke all on phase3.room_ban_appeal_events from public,anon,authenticated;
drop policy if exists room_ban_appeal_events_no_client_access on phase3.room_ban_appeal_events;
create policy room_ban_appeal_events_no_client_access on phase3.room_ban_appeal_events
  for all to public using(false) with check(false);

create table if not exists phase3.room_ban_appeal_requests (
  actor_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
alter table phase3.room_ban_appeal_requests enable row level security;
revoke all on phase3.room_ban_appeal_requests from public,anon,authenticated;
drop policy if exists room_ban_appeal_requests_no_client_access on phase3.room_ban_appeal_requests;
create policy room_ban_appeal_requests_no_client_access on phase3.room_ban_appeal_requests
  for all to public using(false) with check(false);

create or replace function public.phase2_room_ban_appeal_action(
  p_action text,
  p_room_id uuid default null,
  p_appeal_id uuid default null,
  p_reason text default null,
  p_decision text default null,
  p_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid:=phase3.actor();
  ban_row public.room_bans%rowtype;
  appeal_row phase3.room_ban_appeals%rowtype;
  room_owner uuid;
  appeal_room_id uuid;
  request_row phase3.room_ban_appeal_requests%rowtype;
  payload jsonb;
  answer jsonb;
  event_action text;
  normalized_reason text:=btrim(coalesce(p_reason,''));
  normalized_decision text:=btrim(coalesce(p_decision,''));
begin
  if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501';
  end if;
  if p_action is null or p_action not in ('submit','list','status','owner_decide','escalate','admin_decide') then
    raise exception 'INVALID_APPEAL_ACTION' using errcode='22023';
  end if;
  if p_action in ('submit','owner_decide','escalate','admin_decide') and p_request_id is null then
    raise exception 'APPEAL_REQUEST_ID_REQUIRED' using errcode='22023';
  end if;
  if p_action='submit' then
    if p_room_id is null or p_appeal_id is not null or p_decision is not null
       or char_length(normalized_reason) not between 10 and 1500 then
      raise exception 'INVALID_APPEAL_SUBMISSION' using errcode='22023';
    end if;
    select r.owner_id into room_owner from public.rooms r where r.id=p_room_id for update;
    if not found then raise exception 'ROOM_UNAVAILABLE' using errcode='42501'; end if;
    select * into ban_row from public.room_bans b
      where b.room_id=p_room_id and b.user_id=v_actor
        and (b.expires_at is null or b.expires_at>now()) for update;
    if not found then raise exception 'ACTIVE_ROOM_BAN_REQUIRED' using errcode='42501'; end if;
    payload:=jsonb_build_object('sha256',encode(sha256(convert_to(jsonb_build_object(
      'action',p_action,'roomId',p_room_id,'banVersion',ban_row.ban_version,
      'reason',normalized_reason)::text,'UTF8')),'hex'));
    perform pg_catalog.pg_advisory_xact_lock(hashtextextended(v_actor::text||p_request_id::text,0));
    select * into request_row from phase3.room_ban_appeal_requests r
      where r.actor_id=v_actor and r.request_id=p_request_id;
    if found then
      if request_row.payload<>payload then raise exception 'APPEAL_IDEMPOTENCY_CONFLICT'; end if;
      return request_row.result;
    end if;
    insert into phase3.room_ban_appeals(room_id,target_id,submitted_by,ban_version,appeal_reason)
      values(p_room_id,v_actor,v_actor,ban_row.ban_version,normalized_reason)
      on conflict(room_id,target_id,ban_version) do nothing;
    select * into appeal_row from phase3.room_ban_appeals a
      where a.room_id=p_room_id and a.target_id=v_actor and a.ban_version=ban_row.ban_version
      for update;
    if appeal_row.submitted_by<>v_actor then raise exception 'APPEAL_ALREADY_SUBMITTED'; end if;
    answer:=jsonb_build_object('appealId',appeal_row.id,'status',appeal_row.status,
      'roomId',p_room_id,'createdAt',appeal_row.created_at);
    if not exists(select 1 from phase3.room_ban_appeal_events e
       where e.appeal_id=appeal_row.id and e.action='submit') then
      insert into phase3.room_ban_appeal_events(appeal_id,actor_id,action,event_details)
        values(appeal_row.id,v_actor,'submit',jsonb_build_object('roomId',p_room_id));
    end if;
  elsif p_action='list' then
    if p_room_id is null or p_appeal_id is not null then raise exception 'ROOM_REQUIRED'; end if;
    select r.owner_id into room_owner from public.rooms r where r.id=p_room_id;
    if not found then raise exception 'ROOM_UNAVAILABLE' using errcode='42501'; end if;
    if v_actor=room_owner then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',a.id,'roomId',a.room_id,'targetId',a.target_id,'submittedBy',a.submitted_by,
        'reason',a.appeal_reason,'status',a.status,'createdAt',a.created_at,
        'ownerDecisionReason',a.owner_decision_reason
      ) order by a.created_at),'[]'::jsonb) into answer
      from phase3.room_ban_appeals a where a.room_id=p_room_id
        and a.status in ('pending_owner','owner_rejected','owner_accepted','escalated','admin_accepted','admin_rejected');
    elsif phase3.admin_room_authorized() then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',a.id,'roomId',a.room_id,'targetId',a.target_id,'submittedBy',a.submitted_by,
        'reason',a.appeal_reason,'status',a.status,'createdAt',a.created_at,
        'ownerDecisionReason',a.owner_decision_reason
      ) order by a.created_at),'[]'::jsonb) into answer
      from phase3.room_ban_appeals a where a.room_id=p_room_id and a.status='escalated';
    else
      raise exception 'APPEAL_REVIEW_FORBIDDEN' using errcode='42501';
    end if;
    return jsonb_build_object('rows',coalesce(answer,'[]'::jsonb));
  elsif p_action='status' then
    if p_appeal_id is null or p_room_id is not null then raise exception 'APPEAL_ID_REQUIRED'; end if;
    select * into appeal_row from phase3.room_ban_appeals a where a.id=p_appeal_id;
    if not found then raise exception 'APPEAL_UNAVAILABLE' using errcode='42501'; end if;
    select r.owner_id into room_owner from public.rooms r where r.id=appeal_row.room_id;
    if v_actor<>appeal_row.submitted_by and v_actor<>room_owner and not phase3.admin_room_authorized() then
      raise exception 'APPEAL_STATUS_FORBIDDEN' using errcode='42501';
    end if;
    return jsonb_build_object('appealId',appeal_row.id,'status',appeal_row.status,
      'roomId',appeal_row.room_id,'createdAt',appeal_row.created_at,
      'ownerDecisionReason',appeal_row.owner_decision_reason,
      'adminDecisionReason',appeal_row.admin_decision_reason);
  else
    if p_appeal_id is null or p_room_id is not null then raise exception 'APPEAL_ID_REQUIRED'; end if;
    select a.room_id into appeal_room_id from phase3.room_ban_appeals a where a.id=p_appeal_id;
    if not found then raise exception 'APPEAL_UNAVAILABLE' using errcode='42501'; end if;
    select r.owner_id into room_owner from public.rooms r where r.id=appeal_room_id for update;
    if not found then raise exception 'ROOM_UNAVAILABLE'; end if;
    select * into appeal_row from phase3.room_ban_appeals a where a.id=p_appeal_id for update;
    if not found then raise exception 'APPEAL_UNAVAILABLE' using errcode='42501'; end if;
    payload:=jsonb_build_object('sha256',encode(sha256(convert_to(jsonb_build_object(
      'action',p_action,'appealId',p_appeal_id,'decision',normalized_decision,
      'reason',normalized_reason)::text,'UTF8')),'hex'));
    perform pg_catalog.pg_advisory_xact_lock(hashtextextended(v_actor::text||p_request_id::text,0));
    select * into request_row from phase3.room_ban_appeal_requests r
      where r.actor_id=v_actor and r.request_id=p_request_id;
    if found then
      if request_row.payload<>payload then raise exception 'APPEAL_IDEMPOTENCY_CONFLICT'; end if;
      return request_row.result;
    end if;
    if p_action='owner_decide' then
      if v_actor<>room_owner or appeal_row.status<>'pending_owner'
         or normalized_decision not in ('lift','uphold')
         or char_length(normalized_reason) not between 5 and 500 then
        raise exception 'OWNER_APPEAL_DECISION_FORBIDDEN' using errcode='42501';
      end if;
      if normalized_decision='lift' then
        delete from public.room_bans b where b.room_id=appeal_row.room_id
          and b.user_id=appeal_row.target_id and b.ban_version=appeal_row.ban_version;
        update phase3.room_ban_appeals set status='owner_accepted',owner_decided_by=v_actor,
          owner_decision_reason=normalized_reason,owner_decided_at=now(),updated_at=now()
          where id=appeal_row.id;
        event_action:='owner_accept';
      else
        update phase3.room_ban_appeals set status='owner_rejected',owner_decided_by=v_actor,
          owner_decision_reason=normalized_reason,owner_decided_at=now(),updated_at=now()
          where id=appeal_row.id;
        event_action:='owner_reject';
      end if;
    elsif p_action='escalate' then
      if v_actor<>appeal_row.submitted_by or appeal_row.status<>'owner_rejected'
         or p_decision is not null then
        raise exception 'APPEAL_ESCALATION_FORBIDDEN' using errcode='42501';
      end if;
      update phase3.room_ban_appeals set status='escalated',updated_at=now()
        where id=appeal_row.id;
      event_action:='escalate';
    else
      if not phase3.admin_room_authorized() or appeal_row.status<>'escalated'
         or normalized_decision not in ('lift','uphold')
         or char_length(normalized_reason) not between 5 and 500 then
        raise exception 'ADMIN_APPEAL_DECISION_FORBIDDEN' using errcode='42501';
      end if;
      if normalized_decision='lift' then
        delete from public.room_bans b where b.room_id=appeal_row.room_id
          and b.user_id=appeal_row.target_id and b.ban_version=appeal_row.ban_version;
        update phase3.room_ban_appeals set status='admin_accepted',admin_decided_by=v_actor,
          admin_decision_reason=normalized_reason,admin_decided_at=now(),updated_at=now()
          where id=appeal_row.id;
        event_action:='admin_accept';
      else
        update phase3.room_ban_appeals set status='admin_rejected',admin_decided_by=v_actor,
          admin_decision_reason=normalized_reason,admin_decided_at=now(),updated_at=now()
          where id=appeal_row.id;
        event_action:='admin_reject';
      end if;
    end if;
    insert into phase3.room_ban_appeal_events(appeal_id,actor_id,action,event_details)
      values(appeal_row.id,v_actor,event_action,jsonb_build_object(
        'decision',case when p_action='escalate' then null else normalized_decision end,
        'banVersion',appeal_row.ban_version
      ));
    answer:=jsonb_build_object('appealId',appeal_row.id,'action',event_action,
      'status',(select a.status from phase3.room_ban_appeals a where a.id=appeal_row.id));
  end if;
  if p_action in ('submit','owner_decide','escalate','admin_decide') then
    insert into phase3.room_ban_appeal_requests(actor_id,request_id,payload,result)
      values(v_actor,p_request_id,payload,answer);
  end if;
  insert into public.security_audit(actor_id,action,details)
    values(v_actor,'room_ban_appeal_'||p_action,jsonb_build_object(
      'appealId',coalesce(appeal_row.id,(answer->>'appealId')::uuid),
      'roomId',coalesce(appeal_row.room_id,p_room_id),'status',answer->>'status'));
  return answer;
end
$function$;
revoke all on function public.phase2_room_ban_appeal_action(text,uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.phase2_room_ban_appeal_action(text,uuid,uuid,text,text,uuid) to authenticated;
