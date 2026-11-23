create function public.search_app_ban_accounts(p_query text, p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  query text := btrim(p_query);
  result jsonb;
begin
  perform phase3.actor();
  if not phase3.admin_section_allowed('app_bans.manage') then
    raise exception 'APP_BAN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  if query is null or char_length(query) not between 2 and 60
    or p_offset is null or p_offset not between 0 and 100000 then
    raise exception 'INVALID_SEARCH';
  end if;
  select coalesce(jsonb_agg(to_jsonb(matches) order by matches.id),'[]'::jsonb) into result
  from (
    select p.public_id as id,p.display_name as name,
      case when u.banned_until>now() then u.banned_until end as until
    from public.profiles p join auth.users u on u.id=p.id
    where u.deleted_at is null and not coalesce(u.is_anonymous,false) and p.public_id is not null
      and case when query ~ '^[0-9]+$' then p.public_id::text=query
        else strpos(lower(p.display_name),lower(query))>0 end
    order by p.public_id offset p_offset limit 25
  ) matches;
  return result;
end
$$;
revoke all on function public.search_app_ban_accounts(text,integer) from public,anon,authenticated;
grant execute on function public.search_app_ban_accounts(text,integer) to authenticated;

create function public.issue_app_ban(p_public_id integer,p_duration_hours integer,p_reason text)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare
  caller uuid := phase3.actor();
  target uuid;
  expires timestamptz;
  normalized_reason text := btrim(p_reason);
begin
  if not phase3.admin_section_allowed('app_bans.manage') then
    raise exception 'APP_BAN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  if p_duration_hours is null or p_duration_hours not in (0,1,6,24,72,168,336,720,2160)
    or coalesce(char_length(normalized_reason),0) not between 5 and 500 then
    raise exception 'INVALID_BAN_ACTION';
  end if;
  select id into target from public.profiles where public_id=p_public_id;
  if target is null or target=caller
    or exists(select 1 from phase3.system_authority where owner_id=target or main_partner_id=target)
    or exists(select 1 from phase3.admin_access where user_id=target
      and (role='owner' or (role='super_admin' and not phase3.is_owner()))) then
    raise exception 'PROTECTED_BAN_ACCOUNT' using errcode='42501';
  end if;

  expires := case when p_duration_hours=0 then '9999-12-31 23:59:59+00'::timestamptz
    else now()+make_interval(hours=>p_duration_hours) end;
  update auth.users set banned_until=expires,updated_at=now()
  where id=target and deleted_at is null and not coalesce(is_anonymous,false)
    and (banned_until is null or banned_until<=now());
  if not found then raise exception 'BAN_CHANGED'; end if;
  delete from otp_private.verified_sessions where user_id=target;
  insert into public.security_audit(actor_id,action,details)
  values(caller,'app_ban_issued',jsonb_build_object('user',target,'publicId',p_public_id,
    'until',expires,'reason',normalized_reason));
  return expires;
end
$$;
revoke all on function public.issue_app_ban(integer,integer,text) from public,anon,authenticated;
grant execute on function public.issue_app_ban(integer,integer,text) to authenticated;

-- Existing signed-in sessions must also lose access to app data during the ban.
create or replace function public.otp_access_allowed() returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from auth.users u where u.id=(select auth.uid()) and u.banned_until>now())
    and case when coalesce((select enabled from otp_private.enforcement_settings where id=true),false)=false then true
    else exists(select 1 from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
      where v.user_id=(select auth.uid()) and v.session_id=(select (auth.jwt()->>'session_id')::uuid)) end
$$;
