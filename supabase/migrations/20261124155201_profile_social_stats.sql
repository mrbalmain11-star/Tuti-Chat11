begin;

-- Visits are private to the profile owner and retain the latest visit per account.
create table phase3.profile_visits (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_id uuid not null references public.profiles(id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (profile_id, visitor_id),
  check (profile_id <> visitor_id)
);
alter table phase3.profile_visits enable row level security;
revoke all on phase3.profile_visits from public, anon, authenticated;

-- Only an opaque revision is delivered to each affected account.
create table public.profile_stats_updates (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  revision bigint not null default 1
);
alter table public.profile_stats_updates enable row level security;
revoke all on public.profile_stats_updates from public, anon, authenticated;
grant select on public.profile_stats_updates to authenticated;
create policy profile_stats_updates_owner on public.profile_stats_updates
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.otp_access_allowed()));
alter publication supabase_realtime add table public.profile_stats_updates;

create function phase3.bump_profile_stats() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name = 'profile_visits' then
    insert into public.profile_stats_updates(user_id) values (new.profile_id)
      on conflict (user_id) do update set revision = profile_stats_updates.revision + 1;
  elsif tg_table_name = 'social_follows' then
    insert into public.profile_stats_updates(user_id)
      select x.user_id from unnest(array[coalesce(new.follower_id, old.follower_id),
                                  coalesce(new.followed_id, old.followed_id)]) as x(user_id)
      join public.profiles p on p.id = x.user_id
      group by x.user_id order by x.user_id
      on conflict (user_id) do update set revision = profile_stats_updates.revision + 1;
  else
    insert into public.profile_stats_updates(user_id)
      select x.user_id from unnest(array[coalesce(new.blocker_id, old.blocker_id),
                                  coalesce(new.blocked_id, old.blocked_id)]) as x(user_id)
      join public.profiles p on p.id = x.user_id
      group by x.user_id order by x.user_id
      on conflict (user_id) do update set revision = profile_stats_updates.revision + 1;
  end if;
  return null;
end
$$;
revoke all on function phase3.bump_profile_stats() from public, anon, authenticated;
create trigger profile_stats_on_follow after insert or delete on public.social_follows
  for each row execute function phase3.bump_profile_stats();
create trigger profile_stats_on_block after insert or delete on public.dm_blocks
  for each row execute function phase3.bump_profile_stats();
create trigger profile_stats_on_visit after insert or update on phase3.profile_visits
  for each row execute function phase3.bump_profile_stats();

create function phase3.profile_stats_visible(p_viewer uuid, p_target uuid) returns boolean
language sql stable set search_path='' as $$
  select exists (
    select 1 from public.profiles p join auth.users a on a.id=p.id
    where p.id=p_target and a.deleted_at is null and not coalesce(a.is_anonymous,false)
      and a.email_confirmed_at is not null and (a.banned_until is null or a.banned_until<=now())
  ) and not exists (
    select 1 from public.dm_blocks b where (b.blocker_id=p_viewer and b.blocked_id=p_target)
       or (b.blocker_id=p_target and b.blocked_id=p_viewer)
  )
$$;
revoke all on function phase3.profile_stats_visible(uuid,uuid) from public, anon, authenticated;

create function phase3.record_profile_visit(p_target uuid) returns void
language plpgsql security definer set search_path='' as $$
declare viewer uuid := auth.uid();
begin
  if viewer is null or not public.otp_access_allowed() then
    raise exception 'PROFILE_STATS_AUTH_REQUIRED' using errcode='42501';
  end if;
  if viewer=p_target or not phase3.profile_stats_visible(viewer,p_target)
      or not phase3.profile_stats_visible(viewer,viewer) then return; end if;
  insert into phase3.profile_visits(profile_id,visitor_id) values (p_target,viewer)
  on conflict (profile_id,visitor_id) do update set visited_at=excluded.visited_at
    where profile_visits.visited_at < excluded.visited_at;
end
$$;

create function phase3.profile_stats(p_target uuid, p_kind text, p_query text, p_offset integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  viewer uuid := auth.uid();
  subject uuid := coalesce(p_target,viewer);
  query text := phase3.directory_search_text(left(coalesce(p_query,''),80));
  result jsonb;
begin
  if viewer is null or not public.otp_access_allowed()
      or not phase3.profile_stats_visible(viewer,subject) then
    raise exception 'PROFILE_STATS_UNAVAILABLE' using errcode='42501';
  end if;
  if p_kind is not null and p_kind not in ('friends','following','fans','visitors') then
    raise exception 'PROFILE_STATS_KIND_INVALID' using errcode='22023';
  end if;
  if p_kind='visitors' and viewer<>subject then
    raise exception 'PROFILE_VISITORS_PRIVATE' using errcode='42501';
  end if;

  with following as (
    select followed_id as id, created_at from public.social_follows where follower_id=subject and followed_id<>subject
  ), fans as (
    select follower_id as id, created_at from public.social_follows where followed_id=subject and follower_id<>subject
  ), memberships as (
    select 'following' as kind, id, created_at from following
    union all select 'fans', id, created_at from fans
    union all select 'friends', f.id, greatest(f.created_at,a.created_at) from following f join fans a using (id)
    union all select 'visitors', visitor_id, visited_at from phase3.profile_visits
      where profile_id=subject and viewer=subject
  ), visible as materialized (
    select kind, id, max(created_at) as activity_at from memberships
    where phase3.profile_stats_visible(viewer,id)
      and (viewer=subject or phase3.profile_stats_visible(subject,id))
    group by kind,id
  ), matches as materialized (
    select p.id,p.display_name,p.avatar_url,p.gender,p.public_id,s.public_id as special_id,v.activity_at
    from visible v join public.profiles p on p.id=v.id
    left join public.account_special_ids s on s.user_id=p.id
    where v.kind=p_kind and (query='' or strpos(phase3.directory_search_text(p.display_name),query)>0
      or strpos(p.public_id::text,query)>0 or strpos(s.public_id,query)>0)
  ), page as (
    select * from matches order by activity_at desc nulls last,id
    limit 30 offset greatest(coalesce(p_offset,0),0)
  ), cards as (
    select p.activity_at,p.id,jsonb_build_object(
      'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'gender',p.gender,
      'public_id',coalesce(p.special_id,p.public_id::text),
      'badge',case when exists(select 1 from phase3.system_authority a where a.owner_id=p.id)
        then 'admin' else public.staging_profile_identity_badge(p.id) end,
      'vip',(select coalesce(max(v.tier),0) from public.vip_entitlements v
        where v.user_id=p.id and (v.expires_at is null or v.expires_at>now())),
      'wealth',public.staging_royal_level_for_xp(x.wealth),
      'charm',public.staging_royal_level_for_xp(x.charm),
      'frame',public.equipped_public_decoration(p.id,'frames'),
      'royal_track',e.track,'royal_level',e.level,
      'following',exists(select 1 from public.social_follows f where f.follower_id=viewer and f.followed_id=p.id),
      'visited_at',case when p_kind='visitors' then p.activity_at end
    ) as card
    from page p left join public.royal_equipped_frames e on e.scope='personal' and e.subject_id=p.id
    cross join lateral (
      select (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
              join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id) as wealth,
             (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
              join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id) as charm
    ) x
  )
  select jsonb_build_object(
    'friends',(select count(*) from visible where kind='friends'),
    'following',(select count(*) from visible where kind='following'),
    'fans',(select count(*) from visible where kind='fans'),
    'visitors',case when viewer=subject then (select count(*) from visible where kind='visitors') end,
    'matches',(select count(*) from matches),
    'rows',(select coalesce(jsonb_agg(card order by activity_at desc nulls last,id),'[]'::jsonb) from cards)
  ) into result;
  return result;
end
$$;

create function public.record_profile_visit(p_target uuid) returns void
language sql set search_path='' as $$ select phase3.record_profile_visit(p_target) $$;
create function public.profile_stats(p_target uuid, p_kind text, p_query text, p_offset integer) returns jsonb
language sql stable set search_path='' as $$ select phase3.profile_stats(p_target,p_kind,p_query,p_offset) $$;
revoke all on function phase3.record_profile_visit(uuid), public.record_profile_visit(uuid),
  phase3.profile_stats(uuid,text,text,integer), public.profile_stats(uuid,text,text,integer) from public, anon, authenticated;
grant execute on function phase3.record_profile_visit(uuid), public.record_profile_visit(uuid),
  phase3.profile_stats(uuid,text,text,integer), public.profile_stats(uuid,text,text,integer) to authenticated;

commit;
