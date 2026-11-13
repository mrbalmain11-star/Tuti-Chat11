-- Bind final app-ban appeal decisions to the exact ban version submitted for review.
alter table phase3.customer_service_appeals
  add column if not exists target_ban_until timestamptz;

update phase3.customer_service_appeals a
set target_ban_until=u.banned_until
from auth.users u
where u.id=a.target_id and a.target_ban_until is null;

alter table phase3.customer_service_appeals
  drop constraint if exists customer_service_appeals_status_check;
alter table phase3.customer_service_appeals
  add constraint customer_service_appeals_status_check check(status in (
    'pending_admin','under_review','needs_info','reviewed','dismissed','ban_lifted','ban_upheld'
  ));

create or replace function public.phase2_customer_service_appeal_action(
  p_action text,
  p_target_public_id integer default null,
  p_reported_name text default null,
  p_details text default null,
  p_appeal_id uuid default null,
  p_decision text default null,
  p_reviewer_note text default null,
  p_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid:=phase3.actor();
  support_room uuid;
  target_profile public.profiles%rowtype;
  appeal_row phase3.customer_service_appeals%rowtype;
  active_ban_until timestamptz;
  normalized_details text:=btrim(coalesce(p_details,''));
  normalized_name text:=btrim(coalesce(p_reported_name,''));
  normalized_note text:=btrim(coalesce(p_reviewer_note,''));
  stored_status text;
  answer jsonb;
begin
  if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501';
  end if;
  if p_action is null or p_action not in ('submit','list','decide') then
    raise exception 'INVALID_CUSTOMER_SERVICE_ACTION' using errcode='22023';
  end if;
  if p_action='submit' then
    if p_target_public_id is null or p_target_public_id not between 100000 and 999999
      or char_length(normalized_name) not between 1 and 80
      or char_length(normalized_details) not between 10 and 2000
      or p_request_id is null or p_appeal_id is not null or p_decision is not null then
      raise exception 'INVALID_CUSTOMER_SERVICE_APPEAL' using errcode='22023';
    end if;
    select c.room_id into support_room from phase3.customer_service_room_config c where c.singleton;
    if support_room is null then raise exception 'CUSTOMER_SERVICE_ROOM_NOT_CONFIGURED'; end if;
    if not exists(select 1 from public.room_moderators m where m.room_id=support_room and m.user_id=v_actor)
      and not exists(select 1 from public.rooms r where r.id=support_room and r.owner_id=v_actor) then
      raise exception 'CUSTOMER_SERVICE_ROOM_STAFF_REQUIRED' using errcode='42501';
    end if;
    select * into target_profile from public.profiles p where p.public_id=p_target_public_id;
    if not found then raise exception 'TARGET_ACCOUNT_NOT_FOUND'; end if;
    select u.banned_until into active_ban_until from auth.users u
      where u.id=target_profile.id and u.deleted_at is null and u.banned_until is not null and u.banned_until>now();
    if not found then raise exception 'ACTIVE_APP_BAN_REQUIRED' using errcode='42501'; end if;
    perform pg_catalog.pg_advisory_xact_lock(hashtextextended(v_actor::text||p_request_id::text,0));
    select * into appeal_row from phase3.customer_service_appeals a
      where a.submitted_by=v_actor and a.request_id=p_request_id;
    if found then
      if appeal_row.target_id<>target_profile.id or appeal_row.details<>normalized_details
        or appeal_row.reported_name<>normalized_name then
        raise exception 'APPEAL_IDEMPOTENCY_CONFLICT';
      end if;
      return jsonb_build_object('appealId',appeal_row.id,'status',appeal_row.status,
        'targetPublicId',appeal_row.target_public_id);
    end if;
    insert into phase3.customer_service_appeals(target_id,target_public_id,target_ban_until,reported_name,
      support_room_id,submitted_by,details,request_id)
      values(target_profile.id,p_target_public_id,active_ban_until,normalized_name,support_room,v_actor,normalized_details,p_request_id)
      returning * into appeal_row;
    answer:=jsonb_build_object('appealId',appeal_row.id,'status',appeal_row.status,
      'targetPublicId',appeal_row.target_public_id,'createdAt',appeal_row.created_at);
    insert into public.security_audit(actor_id,action,details)
      values(v_actor,'customer_service_appeal_submit',jsonb_build_object(
        'appealId',appeal_row.id,'targetPublicId',appeal_row.target_public_id,'supportRoomId',support_room));
    return answer;
  elsif p_action='list' then
    if not phase3.admin_room_authorized() then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode='42501'; end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',a.id,'targetPublicId',a.target_public_id,'reportedName',a.reported_name,
      'targetName',p.display_name,'supportRoomId',a.support_room_id,'submittedBy',a.submitted_by,
      'details',a.details,'status',a.status,'reviewerNote',a.reviewer_note,'createdAt',a.created_at
    ) order by a.created_at),'[]'::jsonb) into answer
    from phase3.customer_service_appeals a join public.profiles p on p.id=a.target_id
    where a.status in ('pending_admin','under_review','needs_info');
    return jsonb_build_object('rows',coalesce(answer,'[]'::jsonb));
  else
    if not phase3.admin_room_authorized() or p_appeal_id is null or p_request_id is null
      or p_decision not in ('under_review','needs_info','reviewed','dismissed','lift_ban','uphold_ban')
      or char_length(normalized_note) not between 5 and 1000 then
      raise exception 'APPEAL_ADMIN_DECISION_FORBIDDEN' using errcode='42501';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(hashtextextended(p_appeal_id::text||p_request_id::text,0));
    select * into appeal_row from phase3.customer_service_appeals a where a.id=p_appeal_id for update;
    if not found or appeal_row.status not in ('pending_admin','under_review','needs_info') then
      raise exception 'APPEAL_UNAVAILABLE' using errcode='42501';
    end if;
    if p_decision in ('lift_ban','uphold_ban') then
      if appeal_row.target_ban_until is null then raise exception 'APPEAL_BAN_VERSION_UNAVAILABLE'; end if;
      if p_decision='lift_ban' then
        update auth.users set banned_until=null,updated_at=now()
        where id=appeal_row.target_id and banned_until=appeal_row.target_ban_until and banned_until>now();
        if not found then raise exception 'TARGET_BAN_CHANGED_OR_EXPIRED'; end if;
        stored_status:='ban_lifted';
      else
        if not exists(select 1 from auth.users u where u.id=appeal_row.target_id
          and u.banned_until=appeal_row.target_ban_until and u.banned_until>now()) then
          raise exception 'TARGET_BAN_CHANGED_OR_EXPIRED';
        end if;
        stored_status:='ban_upheld';
      end if;
    else stored_status:=p_decision;
    end if;
    update phase3.customer_service_appeals set status=stored_status,reviewer_id=v_actor,
      reviewer_note=normalized_note,reviewed_at=now(),updated_at=now() where id=p_appeal_id;
    insert into public.security_audit(actor_id,action,details)
      values(v_actor,'customer_service_appeal_decide',jsonb_build_object(
        'appealId',p_appeal_id,'decision',p_decision,'status',stored_status,
        'targetPublicId',appeal_row.target_public_id,'banUntilAtSubmission',appeal_row.target_ban_until));
    return jsonb_build_object('appealId',p_appeal_id,'status',stored_status,'decision',p_decision);
  end if;
end
$function$;

revoke all on function public.phase2_customer_service_appeal_action(text,integer,text,text,uuid,text,text,uuid) from public,anon;
grant execute on function public.phase2_customer_service_appeal_action(text,integer,text,text,uuid,text,text,uuid) to authenticated;
