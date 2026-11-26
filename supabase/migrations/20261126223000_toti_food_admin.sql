begin;

alter table toti_games.food_config
  add column release_approved boolean not null default false;

create table toti_games.food_admin_log (
  id bigint generated always as identity primary key,
  actor uuid not null references auth.users(id),
  enabled boolean not null,
  changed_at timestamptz not null default clock_timestamp()
);
alter table toti_games.food_admin_log enable row level security;
revoke all on toti_games.food_admin_log from public, anon, authenticated;

create function public.totichat_food_admin(p_enabled boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := toti_practice_games.player();
  config toti_games.food_config;
begin
  if phase3.admin_section_allowed('games.manage') is distinct from true then
    raise exception 'GAMES_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if p_enabled is not null then
    select * into strict config from toti_games.food_config where singleton for update;
    if p_enabled and not config.release_approved then
      raise exception 'GAMES_RELEASE_APPROVAL_REQUIRED';
    end if;
    if p_enabled and not exists (select 1 from toti_games.treasury where singleton) then
      raise exception 'GAMES_NOT_FUNDED';
    end if;
    if config.enabled is distinct from p_enabled then
      update toti_games.food_config set enabled = p_enabled where singleton returning * into config;
      insert into toti_games.food_admin_log(actor, enabled) values (caller, p_enabled);
    end if;
  else
    select * into strict config from toti_games.food_config where singleton;
  end if;

  return jsonb_build_object(
    'enabled', config.enabled,
    'release_approved', config.release_approved,
    'rounds', (
      select coalesce(jsonb_agg(to_jsonb(report) order by starts_at desc), '[]'::jsonb)
      from (
        select r.starts_at, r.resolved_at, r.result,
          count(distinct e.player) as players, count(e.request_id) as entries,
          coalesce(sum(e.stake), 0)::text as staked,
          coalesce(sum(e.paid) filter (where e.status = 'settled'), 0)::text as payouts
        from (
          select starts_at, resolved_at, result from toti_games.rounds
          where game = 'toti-food' order by starts_at desc limit 10
        ) r
        left join toti_games.entries e on e.game = 'toti-food' and e.starts_at = r.starts_at
        group by r.starts_at, r.resolved_at, r.result
      ) report
    ),
    'audit', (
      select coalesce(jsonb_agg(to_jsonb(item) order by id desc), '[]'::jsonb)
      from (
        select l.id, p.public_id, l.enabled, l.changed_at
        from toti_games.food_admin_log l left join public.profiles p on p.id = l.actor
        order by l.id desc limit 20
      ) item
    )
  );
end;
$$;
revoke all on function public.totichat_food_admin(boolean) from public, anon, authenticated;
grant execute on function public.totichat_food_admin(boolean) to authenticated;

commit;
