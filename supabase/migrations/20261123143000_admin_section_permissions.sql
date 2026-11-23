alter table phase3.admin_access drop constraint admin_access_permissions_check;
alter table phase3.admin_access add constraint admin_access_permissions_check check (permissions <@ array[
  'stats.read','users.manage','agencies.read','rooms.read','operations.read','ids.manage','room.moderate',
  'room.appeals','support.appeals','app_bans.manage','agency.actions','host_agency.open','reports.moderate',
  'reports.read','recharge.manage','staff.manage','banners.manage','catalog.manage','offers.manage',
  'daily_rewards.read','tester_badges.manage'
]::text[]);
alter table phase3.admin_access drop constraint admin_access_role_check;
alter table phase3.admin_access add constraint admin_access_role_check
  check (role in ('owner','admin','super_admin','db','customer_service'));

create function phase3.admin_section_allowed(p_permission text) returns boolean
language sql security definer set search_path='' as $$
  select case when auth.uid() is null or not public.otp_access_allowed() then false else
    phase3.is_owner() or exists (
      select 1 from phase3.admin_access a
      where a.user_id=auth.uid() and p_permission=any(a.permissions)
        and case a.role
          when 'customer_service' then p_permission='support.appeals'
          when 'super_admin' then p_permission not in ('staff.manage','recharge.manage','operations.read')
          when 'admin' then p_permission not in ('staff.manage','recharge.manage','operations.read','app_bans.manage')
          when 'db' then p_permission in ('reports.read','catalog.manage','users.manage','host_agency.open')
          else false end
    ) end
$$;
revoke all on function phase3.admin_section_allowed(text) from public,anon,authenticated;

create function public.owner_staff_by_public_id(
  p_public_id integer, p_action text, p_role text default null, p_permissions text[] default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  caller uuid := phase3.actor();
  target uuid;
  display_name text;
  access phase3.admin_access%rowtype;
begin
  if not phase3.is_owner() then raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
  if p_public_id is null or p_public_id not between 100000 and 999999 then raise exception 'INVALID_PUBLIC_ID'; end if;
  select p.id,p.display_name into target,display_name from public.profiles p where p.public_id=p_public_id;
  if target is null then raise exception 'USER_NOT_FOUND'; end if;
  if target=caller or exists(select 1 from phase3.system_authority s where s.main_partner_id=target)
    or exists(select 1 from phase3.admin_access a where a.user_id=target and a.role='owner')
    then raise exception 'PROTECTED_ACCOUNT' using errcode='42501'; end if;

  if p_action='lookup' then
    select * into access from phase3.admin_access where user_id=target;
    return jsonb_build_object('name',coalesce(display_name,'مستخدم'),'role',access.role,
      'permissions',coalesce(to_jsonb(access.permissions),'[]'::jsonb));
  elsif p_action is distinct from 'save' then raise exception 'INVALID_STAFF_ACTION';
  end if;

  if p_role is null or p_role not in ('admin','super_admin','customer_service') or p_permissions is null
    or array_position(p_permissions,null) is not null
    or p_permissions && array['staff.manage','recharge.manage','operations.read']::text[]
    or ('app_bans.manage'=any(p_permissions) and p_role<>'super_admin')
    or (p_role='customer_service' and not (p_permissions <@ array['support.appeals']::text[]))
    then raise exception 'INVALID_ROLE_PERMISSIONS' using errcode='42501'; end if;
  if not exists(select 1 from auth.users u where u.id=target and u.deleted_at is null
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=now()))
    then raise exception 'ACTIVE_VERIFIED_ACCOUNT_REQUIRED'; end if;
  insert into phase3.admin_access(user_id,role,permissions,assigned_by)
  values(target,p_role,array(select distinct permission from unnest(p_permissions) as permission order by permission),caller)
  on conflict(user_id) do update set role=excluded.role,permissions=excluded.permissions,
    assigned_by=excluded.assigned_by,updated_at=now();
  insert into public.security_audit(actor_id,action,details)
  values(caller,'role_assignment',jsonb_build_object('user',target,'publicId',p_public_id,'role',p_role,'permissions',p_permissions));
  return jsonb_build_object('id',p_public_id,'role',p_role,'permissions',p_permissions);
end
$$;
revoke all on function public.owner_staff_by_public_id(integer,text,text,text[]) from public,anon,authenticated;
grant execute on function public.owner_staff_by_public_id(integer,text,text,text[]) to authenticated;

create function public.admin_app_bans(
  p_action text, p_offset integer default 0, p_public_id integer default null,
  p_expected_until timestamptz default null, p_reason text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  caller uuid := phase3.actor();
  target uuid;
  result jsonb;
begin
  if not phase3.admin_section_allowed('app_bans.manage') then
    raise exception 'APP_BAN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  if p_action='list' then
    if p_offset is null or p_offset not between 0 and 100000 then raise exception 'INVALID_PAGE'; end if;
    select coalesce(jsonb_agg(to_jsonb(b) order by b.until desc,b.id),'[]'::jsonb) into result from (
      select p.public_id as id,p.display_name as name,u.banned_until as until
      from auth.users u join public.profiles p on p.id=u.id
      where u.deleted_at is null and u.banned_until>now() and p.public_id is not null
      order by u.banned_until desc,p.public_id offset p_offset limit 25
    ) b;
    return result;
  elsif p_action is distinct from 'lift' or p_public_id is null or p_expected_until is null
    or coalesce(char_length(btrim(p_reason)),0) not between 5 and 500 then
    raise exception 'INVALID_BAN_ACTION';
  end if;
  select id into target from public.profiles where public_id=p_public_id;
  if target is null or target=caller then raise exception 'INVALID_BAN_ACCOUNT'; end if;
  update auth.users set banned_until=null,updated_at=now()
    where id=target and deleted_at is null and banned_until=p_expected_until and banned_until>now();
  if not found then raise exception 'BAN_CHANGED'; end if;
  insert into public.security_audit(actor_id,action,details)
  values(caller,'app_ban_lifted',jsonb_build_object('user',target,'publicId',p_public_id,
    'previousUntil',p_expected_until,'reason',btrim(p_reason)));
  return jsonb_build_object('lifted',true);
end
$$;
revoke all on function public.admin_app_bans(text,integer,integer,timestamptz,text) from public,anon,authenticated;
grant execute on function public.admin_app_bans(text,integer,integer,timestamptz,text) to authenticated;
CREATE OR REPLACE FUNCTION public.can_manage_decoration_catalog()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select phase3.admin_section_allowed('catalog.manage')
$function$;

CREATE OR REPLACE FUNCTION public.owner_dashboard_counts()
 RETURNS TABLE(users_count bigint, agencies_count bigint, rooms_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select (select count(*) from public.profiles),(select count(*) from public.agencies),(select count(*) from public.rooms) where phase3.admin_section_allowed('stats.read') and (select auth.uid()) is not null) otp_guarded where public.otp_access_allowed() $function$;

CREATE OR REPLACE FUNCTION public.owner_find_user_by_public_id(p_public_id integer)
 RETURNS TABLE(user_id uuid, display_name text, normal_id integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select p.id,p.display_name,p.public_id from public.profiles p
 where p.public_id=p_public_id
 and (select auth.uid()) is not null
 and phase3.admin_section_allowed('ids.manage')
 limit 1) otp_guarded where public.otp_access_allowed() $function$;

CREATE OR REPLACE FUNCTION phase3.special_id_grant(p_target uuid, p_public_id text, p_reason text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare caller uuid:=phase3.actor();note text:=btrim(coalesce(p_reason,''));
 old phase3.special_id_grant_requests%rowtype;
 current_code text;result jsonb;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if not phase3.admin_section_allowed('ids.manage') then raise exception 'Owner approval required' using errcode='42501';end if;
 if p_target is null or p_request_id is null or
   p_public_id is null or p_public_id !~ '^[1-9][0-9]{3,9}$' or
   char_length(note) not between 10 and 300 then
   raise exception 'Invalid unique account ID approval';
 end if;
 if not exists(select 1 from auth.users u join public.profiles p on p.id=u.id
   where u.id=p_target and u.deleted_at is null
   and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
   and (u.banned_until is null or u.banned_until<now())) then
   raise exception 'Verified account required' using errcode='42501';
 end if;
 select * into old from phase3.special_id_grant_requests r
 where r.actor_id=caller and r.request_id=p_request_id;
 if found then
  if old.target_id<>p_target or old.public_id<>p_public_id then
   raise exception 'Special ID idempotency conflict';
  end if;
  return old.result;
 end if;
 if (select count(*) from phase3.special_id_grant_requests r
   where r.actor_id=caller and r.created_at>now()-interval '1 minute')>=20
 then raise exception 'Special ID rate limit exceeded';end if;
 select public_id into current_code from public.account_special_ids where user_id=p_target;
 if found then
  raise exception 'Public ID already assigned and cannot be changed' using errcode='23505';
 end if;
 if exists(select 1 from public.account_special_ids where public_id=p_public_id) then
  raise exception 'Public ID already reserved' using errcode='23505';
 end if;
 insert into public.account_special_ids(user_id,public_id,granted_by,reason)
 values(p_target,p_public_id,caller,note);
 result:=jsonb_build_object('userId',p_target,'publicId',p_public_id,'success',true);
 insert into phase3.special_id_grant_requests(actor_id,request_id,target_id,public_id,result)
 values(caller,p_request_id,p_target,p_public_id,result);
 insert into public.security_audit(actor_id,action,details)values(caller,'special_public_id_grant',
  jsonb_build_object('targetId',p_target,'publicId',p_public_id,'requestId',p_request_id));
 return result;
end $function$;

CREATE OR REPLACE FUNCTION public.owner_list_tester_badges()
 RETURNS TABLE(public_id integer, display_name text, granted_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select p.public_id,p.display_name,b.granted_at from public.totichat_tester_badges b join public.profiles p on p.id=b.user_id where phase3.admin_section_allowed('tester_badges.manage') order by b.granted_at desc) otp_guarded where public.otp_access_allowed() $function$;

CREATE OR REPLACE FUNCTION public.owner_manage_tester_badge(p_public_id integer, p_grant boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_target uuid; v_actor uuid := auth.uid();
begin if not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if v_actor is null or not phase3.admin_section_allowed('tester_badges.manage') then raise exception 'Owner access required' using errcode='42501'; end if;
 select id into v_target from public.profiles where public_id=p_public_id;
 if v_target is null then raise exception 'User ID not found'; end if;
 if p_grant then insert into public.totichat_tester_badges(user_id,granted_by) values(v_target,v_actor) on conflict(user_id) do nothing;
 else delete from public.totichat_tester_badges where user_id=v_target; end if;
 return jsonb_build_object('public_id',p_public_id,'granted',p_grant);
end $function$;

CREATE OR REPLACE FUNCTION public.manage_recharge_offer(p_id uuid, p_title text, p_description text, p_price_iqd bigint, p_coins bigint, p_bonus_coins bigint, p_image_url text, p_status text, p_starts_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_ends_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid;
begin if not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if auth.uid() is null or not phase3.admin_section_allowed('offers.manage') then raise exception 'Admin access required' using errcode='42501'; end if;
 if length(trim(p_title)) not between 3 and 100 or p_price_iqd<=0 or p_coins<=0 or p_bonus_coins<0 or p_status not in ('draft','published','paused') or (p_starts_at is not null and p_ends_at is not null and p_ends_at<=p_starts_at) then raise exception 'Invalid offer'; end if;
 if p_id is null then
 insert into public.recharge_offers(title,description,price_iqd,coins,bonus_coins,image_url,status,starts_at,ends_at,created_by) values(trim(p_title),coalesce(p_description,''),p_price_iqd,p_coins,p_bonus_coins,nullif(p_image_url,''),p_status,p_starts_at,p_ends_at,auth.uid()) returning id into v_id;
 else
 update public.recharge_offers set title=trim(p_title),description=coalesce(p_description,''),price_iqd=p_price_iqd,coins=p_coins,bonus_coins=p_bonus_coins,image_url=nullif(p_image_url,''),status=p_status,starts_at=p_starts_at,ends_at=p_ends_at where id=p_id returning id into v_id;
 if v_id is null then raise exception 'Offer not found'; end if;
 end if;
 return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.totichat_admin_reports()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 if auth.uid() is null or not public.otp_access_allowed() or not phase3.admin_section_allowed('reports.moderate') then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'reporterId',reporter.public_id,'targetId',target.public_id,'targetName',target.display_name,'category',r.category,'details',r.details,'evidencePaths',r.evidence_paths,'status',r.status,'createdAt',r.created_at) order by r.created_at desc),'[]'::jsonb)
 into result from (select * from public.user_reports order by created_at desc limit 100) r
 join public.profiles reporter on reporter.id=r.reporter_id
 join public.profiles target on target.id=r.target_id;
 return result;
end $function$;

CREATE OR REPLACE FUNCTION public.totichat_admin_report_status(p_id uuid, p_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not public.otp_access_allowed() or not phase3.admin_section_allowed('reports.moderate') then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 if p_status not in ('reviewing','resolved','dismissed') then raise exception 'INVALID_STATUS';end if;
 update public.user_reports set status=p_status,reviewed_by=auth.uid(),reviewed_at=now() where id=p_id;
 return found;
end $function$;

CREATE OR REPLACE FUNCTION phase3.admin_room_moderation_state(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare room_owner uuid; bans jsonb; members jsonb;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if not phase3.admin_section_allowed('room.moderate') then raise exception 'Owner or designated partner required' using errcode='42501';end if;
 if p_room_id is null then raise exception 'Room required';end if;
 select r.owner_id into room_owner from public.rooms r where r.id=p_room_id;
 if not found then raise exception 'Room unavailable';end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into bans from(
  select b.user_id,b.banned_by,b.reason,b.created_at from public.room_bans b
  where b.room_id=p_room_id order by b.created_at desc,b.user_id limit 200) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into members from(
  select m.user_id,m.seat_no,m.is_muted from public.room_members m
  where m.room_id=p_room_id order by m.joined_at,m.user_id limit 200) t;
 return jsonb_build_object('roomId',p_room_id,'roomOwnerId',room_owner,
  'banned',bans,'members',members,'readOnly',true);
end $function$;

CREATE OR REPLACE FUNCTION phase3.admin_room_moderation_action(p_room_id uuid, p_target uuid, p_action text, p_reason text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare current_actor uuid:=phase3.actor();room_owner uuid;
 reason_text text:=btrim(coalesce(p_reason,''));payload jsonb;
 prior phase3.admin_room_requests%rowtype;outcome jsonb;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if not phase3.admin_section_allowed('room.moderate') then
   raise exception 'Only Owner or designated main partner can moderate from Admin' using errcode='42501';
 end if;
 if p_room_id is null or p_target is null or p_request_id is null
    or p_action is null or p_action not in('ban','unban')
    or char_length(reason_text) not between 10 and 300 then
   raise exception 'Valid room, account, action and documented reason required';
 end if;
 -- Serialize with joins and existing room-owner moderation.
 select r.owner_id into room_owner from public.rooms r where r.id=p_room_id for update;
 if not found then raise exception 'Room unavailable';end if;
 if p_target=room_owner or p_target=current_actor or exists(select 1 from phase3.system_authority a
  where a.singleton and (a.owner_id=p_target or a.main_partner_id=p_target)) then
  raise exception 'Protected account cannot be moderated through dashboard' using errcode='42501';
 end if;
 if not exists(select 1 from auth.users u where u.id=p_target and u.deleted_at is null) then
  raise exception 'Target user missing';
 end if;
 payload:=jsonb_build_object('room',p_room_id,'target',p_target,'action',p_action,'reason',reason_text);
 select * into prior from phase3.admin_room_requests r
  where r.actor_id=current_actor and r.request_id=p_request_id;
 if found then
  if prior.payload<>payload then raise exception 'Idempotency request mismatch';end if;
  return prior.result;
 end if;
 if (select count(*) from phase3.admin_room_requests r where
   r.actor_id=current_actor and r.created_at>now()-interval '1 minute')>=15 then
  raise exception 'Admin room moderation rate exceeded';end if;
 if p_action='ban' then
  if not exists(select 1 from public.room_members m where
    m.room_id=p_room_id and m.user_id=p_target) then
   raise exception 'Select an actual room participant to ban';end if;
  insert into public.room_bans(room_id,user_id,banned_by,reason)
  values(p_room_id,p_target,current_actor,reason_text)
  on conflict(room_id,user_id) do update set
   banned_by=excluded.banned_by,reason=excluded.reason,created_at=now(),
   expires_at=null,ban_version=gen_random_uuid();
  delete from public.room_members m where m.room_id=p_room_id and m.user_id=p_target;
 else
  delete from public.room_bans b where b.room_id=p_room_id and b.user_id=p_target;
  if not found then raise exception 'Ban record does not exist';end if;
 end if;
 outcome:=jsonb_build_object('roomId',p_room_id,'targetId',p_target,'action',p_action,
  'success',true,'scope','room_only','requestId',p_request_id);
 insert into phase3.admin_room_requests(actor_id,request_id,payload,result)
 values(current_actor,p_request_id,payload,outcome);
 insert into public.security_audit(actor_id,action,details)
 values(current_actor,'admin_room_'||p_action,payload||jsonb_build_object('requestId',p_request_id));
 return outcome;
end $function$;

CREATE OR REPLACE FUNCTION public.phase2_room_ban_appeal_action(p_action text, p_room_id uuid DEFAULT NULL::uuid, p_appeal_id uuid DEFAULT NULL::uuid, p_reason text DEFAULT NULL::text, p_decision text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    elsif phase3.admin_section_allowed('room.appeals') then
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
    if v_actor<>appeal_row.submitted_by and v_actor<>room_owner and not phase3.admin_section_allowed('room.appeals') then
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
      if not phase3.admin_section_allowed('room.appeals') or appeal_row.status<>'escalated'
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

CREATE OR REPLACE FUNCTION phase3.banner_admin_allowed()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor_id uuid:=phase3.actor();
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 return phase3.admin_section_allowed('banners.manage');
end $function$;

CREATE OR REPLACE FUNCTION public.owner_dashboard_recent()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select jsonb_build_object(
  'users',case when phase3.admin_section_allowed('users.manage') then coalesce((select jsonb_agg(to_jsonb(u)) from (select public_id,display_name,created_at from public.profiles order by created_at desc limit 20) u),'[]'::jsonb) else '[]'::jsonb end,
  'agencies',case when phase3.admin_section_allowed('agencies.read') then coalesce((select jsonb_agg(to_jsonb(a)) from (select public_id,name,created_at from public.agencies order by created_at desc limit 20) a),'[]'::jsonb) else '[]'::jsonb end,
  'rooms',case when phase3.admin_section_allowed('rooms.read') then coalesce((select jsonb_agg(to_jsonb(r)) from (select id,title,created_at from public.rooms order by created_at desc limit 20) r),'[]'::jsonb) else '[]'::jsonb end
 ) where (select auth.uid()) is not null and (phase3.admin_section_allowed('users.manage') or phase3.admin_section_allowed('agencies.read') or phase3.admin_section_allowed('rooms.read'))) otp_guarded where public.otp_access_allowed() $function$;

CREATE OR REPLACE FUNCTION phase3.admin_session()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=phase3.actor(); own boolean:=phase3.is_owner(); access phase3.admin_access%rowtype; partner boolean;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 select * into access from phase3.admin_access where user_id=u;
 select main_partner_id=u into partner from phase3.system_authority where singleton;
 return jsonb_build_object('isOwner',own,'isMainPartner',coalesce(partner,false),'role',case when own then 'owner' else coalesce(access.role,'user') end,'permissions',coalesce(to_jsonb(access.permissions),'[]'::jsonb),
 'canManageCatalogs',phase3.admin_section_allowed('catalog.manage'),
 'canManageHostAgencies',phase3.admin_section_allowed('agency.actions'),'canManageRechargeAgencies',own or coalesce(partner,false),'canReadReports',phase3.admin_section_allowed('reports.read'));
end $function$;

CREATE OR REPLACE FUNCTION phase3.agency_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=phase3.actor();s jsonb:=phase3.admin_session();manage_host boolean:=(s->>'canManageHostAgencies')::boolean;manage_recharge boolean:=(s->>'canManageRechargeAgencies')::boolean;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if; return jsonb_build_object('authority',s,
 'agencies',(select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at),'[]') from public.agencies a where (a.kind='host' and a.is_active) or a.owner_id=u or (a.kind='host' and manage_host) or (a.kind='recharge' and manage_recharge)),
 'registrations',(select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]') from public.agency_registrations r where r.applicant_id=u or (r.kind='host' and (manage_host or phase3.admin_section_allowed('host_agency.open'))) or (r.kind='recharge' and manage_recharge)),
 'members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from public.agency_members m join public.agencies a on a.id=m.agency_id where m.user_id=u or a.owner_id=u or manage_host),
 'requests',(select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc),'[]') from public.agency_join_requests r where r.user_id=u or manage_host or exists(select 1 from public.agencies a where a.id in(r.agency_id,r.old_agency_id) and a.owner_id=u)));
end $function$;

CREATE OR REPLACE FUNCTION phase3.agency_action(p_action text, p_data jsonb, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
<<agency_action>>
declare u uuid:=phase3.actor();body jsonb;prior phase3.agency_requests%rowtype;reg public.agency_registrations%rowtype;a public.agencies%rowtype;j public.agency_join_requests%rowtype;kind text;name text;note text;commission numeric;old_id uuid;id uuid;answer jsonb;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 -- Verify actor before lock through phase3.actor(); serialize sensitive retries by session owner.
 perform pg_advisory_xact_lock(hashtextextended('totichat-agency_action:'||u::text,0));
 if p_action is null or p_action not in('register','approve_registration','reject_registration','edit','close','join','approve_old','accept_join','reject_join','exception_transfer') or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>5000 or p_request_id is null then raise exception 'Invalid agency operation';end if;
 body:=jsonb_build_object('action',p_action,'data',p_data);
 select * into prior from phase3.agency_requests where actor_id=u and request_id=p_request_id;
 if found then if prior.payload<>body then raise exception 'Idempotency key conflict';end if;return prior.result;end if;
 if (select count(*) from phase3.agency_requests where actor_id=u and created_at>now()-interval '1 minute')>=30 then raise exception 'Rate limit exceeded';end if;
 if p_action='register' then
  kind:=p_data->>'kind';name:=btrim(p_data->>'name');
  if kind is null or kind not in('host','recharge') or name is null or char_length(name) not between 2 and 80 or coalesce(char_length(btrim(p_data->>'contact')),0) not between 3 and 100 or coalesce(char_length(btrim(p_data->>'reason')),0) not between 3 and 500 then raise exception 'Agency name, contact and reason required';end if;
  if exists(select 1 from public.agencies where owner_id=u and agencies.kind=agency_action.kind and is_active) then raise exception 'Agency already active';end if;
  insert into public.agency_registrations(applicant_id,kind,name,details) values(u,kind,name,jsonb_build_object('contact',p_data->>'contact','reason',p_data->>'reason')) returning * into reg;answer:=to_jsonb(reg);
 elsif p_action in('approve_registration','reject_registration') then
  select * into reg from public.agency_registrations where agency_registrations.id=(p_data->>'id')::uuid for update;
  if not found then raise exception 'Registration not found';end if;
  if not (
  phase3.can_manage_agency(reg.kind) or (reg.kind='host' and phase3.admin_section_allowed('host_agency.open')) or
  (
    p_action='approve_registration' and reg.kind='host' and
    exists (
      select 1 from phase3.admin_access db_staff
      where db_staff.user_id=u and db_staff.role='db'
        and 'host_agency.open'=any(db_staff.permissions)
    )
  )
 ) then raise exception 'Agency management permission required' using errcode='42501';end if;
  if reg.status<>'pending' then raise exception 'Registration already reviewed';end if;
  note:=btrim(p_data->>'note');if note is null or char_length(note) not between 3 and 500 then raise exception 'Review note required';end if;
  if p_action='approve_registration' then
   if not exists(select 1 from auth.users where auth.users.id=reg.applicant_id and email_confirmed_at is not null and deleted_at is null and (banned_until is null or banned_until<now())) then raise exception 'Verified active agency owner required';end if;
   commission:=(p_data->>'commission_percent')::numeric;if commission is null or commission<0 or commission>100 or commission='NaN'::numeric then raise exception 'Explicit valid commission required';end if;
   insert into public.agencies(owner_id,kind,name,commission_percent,created_by) values(reg.applicant_id,reg.kind,reg.name,commission,u) returning agencies.id into id;
  end if;
  update public.agency_registrations set status=case p_action when 'approve_registration' then 'approved' else 'rejected' end,agency_id=agency_action.id,reviewed_by=u,review_note=note,reviewed_at=now() where agency_registrations.id=reg.id returning * into reg;answer:=to_jsonb(reg);
 elsif p_action in('edit','close') then
  select * into a from public.agencies where agencies.id=(p_data->>'id')::uuid for update;
  if not found then raise exception 'Agency not found';end if;
  if not phase3.can_manage_agency(a.kind) then raise exception 'Agency management permission required' using errcode='42501';end if;
  if p_action='close' then
   note:=btrim(p_data->>'note');if note is null or char_length(note) not between 3 and 500 then raise exception 'Closure reason required';end if;
   update public.agencies set is_active=false,updated_at=now() where agencies.id=a.id returning * into a;
  else
   name:=btrim(p_data->>'name');commission:=(p_data->>'commission_percent')::numeric;
   if name is null or char_length(name) not between 2 and 80 or commission is null or commission<0 or commission>100 or commission='NaN'::numeric then raise exception 'Agency settings invalid';end if;
   update public.agencies set name=agency_action.name,commission_percent=commission,updated_at=now() where agencies.id=a.id returning * into a;
  end if;answer:=to_jsonb(a);
 elsif p_action='join' then
  select * into a from public.agencies where agencies.id=(p_data->>'agency_id')::uuid and is_active and agencies.kind='host' for share;
  if not found then raise exception 'Active host agency required';end if;
  perform user_id from public.wallets where user_id=u for update;
  select agency_id into old_id from public.agency_members where user_id=u;
  if old_id=a.id then raise exception 'Already a member';end if;
  note:=btrim(p_data->>'reason');if note is null or char_length(note) not between 3 and 500 then raise exception 'Join reason required';end if;
  insert into public.agency_join_requests(user_id,agency_id,old_agency_id,status,reason) values(u,a.id,old_id,case when old_id is null then 'pending_new' else 'pending_old' end,note) returning * into j;answer:=to_jsonb(j);
 else
  select * into j from public.agency_join_requests where agency_join_requests.id=(p_data->>'id')::uuid for update;
  if not found then raise exception 'Join request not found';end if;
  select * into a from public.agencies where agencies.id=j.agency_id for share;
  if p_action='approve_old' then
   if j.status<>'pending_old' or not exists(select 1 from public.agencies where agencies.id=j.old_agency_id and owner_id=u) then raise exception 'Old agency approval required' using errcode='42501';end if;
   update public.agency_join_requests set status='pending_new',old_approved_by=u,updated_at=now() where agency_join_requests.id=j.id returning * into j;
  elsif p_action='reject_join' then
   if j.status not in('pending_old','pending_new') or not(a.owner_id=u or exists(select 1 from public.agencies where agencies.id=j.old_agency_id and owner_id=u) or phase3.can_manage_agency('host')) then raise exception 'Agency approval permission required' using errcode='42501';end if;
   update public.agency_join_requests set status='rejected',accepted_by=u,updated_at=now() where agency_join_requests.id=j.id returning * into j;
  else
   if p_action='exception_transfer' then
    if j.status not in('pending_old','pending_new') or not phase3.can_manage_agency('host') then raise exception 'Investigating administrator required' using errcode='42501';end if;
    note:=btrim(p_data->>'note');if note is null or char_length(note) not between 10 and 500 then raise exception 'Investigation decision required';end if;
   elsif j.status<>'pending_new' or a.owner_id<>u then raise exception 'New agency approval required' using errcode='42501';end if;
   if not a.is_active or a.kind<>'host' then raise exception 'Target agency inactive';end if;
   if not exists(select 1 from auth.users where auth.users.id=j.user_id and deleted_at is null and email_confirmed_at is not null and (banned_until is null or banned_until<now())) then raise exception 'Active confirmed host required';end if;
   perform user_id from public.wallets where user_id=j.user_id for update;
   select agency_id into old_id from public.agency_members where user_id=j.user_id;
   if old_id is distinct from j.old_agency_id then raise exception 'Host membership changed; submit a new request';end if;
   insert into public.agency_members(user_id,agency_id) values(j.user_id,j.agency_id) on conflict(user_id) do update set agency_id=excluded.agency_id,joined_at=now();
   update public.agency_join_requests set status='completed',accepted_by=u,review_note=note,updated_at=now() where agency_join_requests.id=j.id returning * into j;
  end if;answer:=to_jsonb(j);
 end if;
 insert into phase3.agency_requests values(u,p_request_id,body,answer,now());
 insert into public.security_audit(actor_id,action,details) values(u,'agency_'||p_action,body||jsonb_build_object('result_id',answer->>'id'));
 return answer;
end $function$;

CREATE OR REPLACE FUNCTION public.phase2_customer_service_appeal_action(p_action text, p_target_public_id integer DEFAULT NULL::integer, p_reported_name text DEFAULT NULL::text, p_details text DEFAULT NULL::text, p_appeal_id uuid DEFAULT NULL::uuid, p_decision text DEFAULT NULL::text, p_reviewer_note text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    if not phase3.admin_section_allowed('support.appeals') then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode='42501'; end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',a.id,'targetPublicId',a.target_public_id,'reportedName',a.reported_name,
      'targetName',p.display_name,'supportRoomId',a.support_room_id,'submittedBy',a.submitted_by,
      'details',a.details,'status',a.status,'reviewerNote',a.reviewer_note,'createdAt',a.created_at
    ) order by a.created_at),'[]'::jsonb) into answer
    from phase3.customer_service_appeals a join public.profiles p on p.id=a.target_id
    where a.status in ('pending_admin','under_review','needs_info');
    return jsonb_build_object('rows',coalesce(answer,'[]'::jsonb));
  else
    if not (phase3.admin_section_allowed('support.appeals') and phase3.admin_section_allowed('app_bans.manage')) or p_appeal_id is null or p_request_id is null
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


create function public.has_admin_section(p_permission text) returns boolean
language sql security definer set search_path='' as $$
  select phase3.admin_section_allowed(p_permission)
$$;
revoke all on function public.has_admin_section(text) from public,anon,authenticated;
grant execute on function public.has_admin_section(text) to authenticated;

alter policy recharge_offers_read on public.recharge_offers using (
  (status='published' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()))
  or case when (select auth.uid()) is null then false else (select public.has_admin_section('offers.manage')) end
);
alter policy tc_report_evidence_read on storage.objects using (
  bucket_id='totichat-report-evidence' and public.otp_access_allowed()
  and (split_part(name,'/',1)=(select auth.uid())::text
    or (select public.has_admin_section('reports.moderate')))
);
