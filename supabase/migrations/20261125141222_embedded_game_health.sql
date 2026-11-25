create table toti_games.embedded_health (
  actor uuid not null references public.profiles(id) on delete cascade,
  code text not null references toti_games.embedded_catalog(code) on delete cascade,
  kind text not null check (kind in ('screen','connection')),
  seen_at timestamptz not null default clock_timestamp(),
  primary key (actor,code,kind)
);
alter table toti_games.embedded_health enable row level security;
revoke all on toti_games.embedded_health from public,anon,authenticated;
create index embedded_health_recent on toti_games.embedded_health (seen_at);
create index embedded_plays_winners on toti_games.embedded_plays (code,player) where won;

create function public.totichat_embedded_report_issue(p_code text,p_kind text) returns void
language plpgsql security definer set search_path='' as $$
declare actor_id uuid := toti_practice_games.player();
begin
  if p_kind is null or p_kind not in ('screen','connection') or not exists (
    select 1 from toti_games.embedded_catalog c where c.code=p_code
  ) then raise exception 'INVALID_GAME_ISSUE' using errcode='22023'; end if;
  insert into toti_games.embedded_health as health(actor,code,kind) values (actor_id,p_code,p_kind)
  on conflict (actor,code,kind) do update set seen_at=excluded.seen_at
  where health.seen_at < excluded.seen_at-interval '15 minutes';
end; $$;

create function public.totichat_embedded_health() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  perform toti_practice_games.player();
  if not coalesce(phase3.admin_section_allowed('games.manage'),false) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  return (select coalesce(jsonb_agg(to_jsonb(g) order by code,kind),'[]'::jsonb)
    from (select code,kind,count(*) as accounts,max(seen_at) as last_seen
      from toti_games.embedded_health where seen_at>=statement_timestamp()-interval '24 hours' group by code,kind) g);
end; $$;

revoke execute on function public.totichat_embedded_report_issue(text,text),public.totichat_embedded_health() from public,anon;
grant execute on function public.totichat_embedded_report_issue(text,text),public.totichat_embedded_health() to authenticated;

create or replace function public.totichat_original_greedy_pick(p_slot timestamptz,p_food text) returns text
language plpgsql security definer set search_path='' as $$
declare actor uuid:=toti_practice_games.player(); chosen text; at_time timestamptz; active_slot timestamptz;
begin
  if p_food is null or p_food not in ('carrot','tomato','corn','broccoli','shrimp','chicken','meat','fish') then raise exception 'INVALID_GREEDY_FOOD'; end if;
  perform pg_advisory_xact_lock(hashtextextended('greedy-pick:'||actor::text,0));
  select food into chosen from toti_games.original_greedy_picks where player=actor and slot=p_slot;
  if found then
    if chosen<>p_food then raise exception 'GREEDY_PICK_ALREADY_RECORDED'; end if;
    return chosen;
  end if;
  perform 1 from toti_games.original_game_config where code='greedy-original' and enabled for share;
  if not found then raise exception 'GREEDY_UNAVAILABLE'; end if;
  at_time:=clock_timestamp();
  active_slot:=date_bin(interval '30 seconds',at_time,timestamptz '2000-01-01 00:00:00+00');
  if p_slot is distinct from active_slot or at_time>=active_slot+interval '22 seconds' then raise exception 'GREEDY_PICK_CLOSED'; end if;
  insert into toti_games.original_greedy_picks values(actor,p_slot,p_food);
  return p_food;
end;
$$;
