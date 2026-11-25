begin;
create table toti_games.original_game_config (
  code text primary key check (code='greedy-original'),
  enabled boolean not null,
  secret bytea not null,
  starts_at timestamptz not null
);
insert into toti_games.original_game_config values ('greedy-original',true,extensions.gen_random_bytes(32),
  date_bin(interval '30 seconds',clock_timestamp(),timestamptz '2000-01-01 00:00:00+00'));
create table toti_games.original_greedy_picks (
  player uuid not null references auth.users(id),
  slot timestamptz not null,
  food text not null check(food in ('carrot','tomato','corn','broccoli','shrimp','chicken','meat','fish')),
  primary key(player,slot)
);
alter table toti_games.original_game_config enable row level security;
alter table toti_games.original_greedy_picks enable row level security;
revoke all on toti_games.original_game_config,toti_games.original_greedy_picks from public,anon,authenticated;

create function toti_games.original_greedy_draw(p_slot timestamptz,p_secret bytea) returns text
language plpgsql immutable set search_path='' as $$
declare d bytea; n integer; i integer := 0;
begin
  loop
    d := extensions.hmac(convert_to(extract(epoch from p_slot)::bigint::text||':'||i,'UTF8'),p_secret,'sha256');
    n := get_byte(d,0)*256+get_byte(d,1);
    if n<65536-(65536%112) then exit; end if;
    i := i+1;
  end loop;
  n := n%112;
  return case when n<22 then 'carrot' when n<42 then 'tomato' when n<62 then 'corn'
    when n<82 then 'broccoli' when n<94 then 'shrimp' when n<104 then 'chicken'
    when n<109 then 'meat' else 'fish' end;
end;
$$;
revoke all on function toti_games.original_greedy_draw(timestamptz,bytea) from public,anon,authenticated;

create function public.totichat_original_greedy_state() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  actor uuid := toti_practice_games.player();
  cfg toti_games.original_game_config;
  server_time timestamptz := statement_timestamp();
  current_slot timestamptz := date_bin(interval '30 seconds',server_time,timestamptz '2000-01-01 00:00:00+00');
  shown_slot timestamptz;
begin
  select * into strict cfg from toti_games.original_game_config where code='greedy-original';
  if not cfg.enabled then return jsonb_build_object('enabled',false); end if;
  shown_slot := case when server_time >= current_slot+interval '22 seconds' then current_slot else current_slot-interval '30 seconds' end;
  return jsonb_build_object(
    'enabled',true,'serverTime',server_time,'slot',current_slot,'closesAt',current_slot+interval '22 seconds',
    'player',(select jsonb_build_object('id',p.id,'publicId',p.public_id,'name',p.display_name,'avatar',p.avatar_url,'coins',w.coins)
       from public.profiles p left join public.wallets w on w.user_id=p.id where p.id=actor),
    'pick',(select g.food from toti_games.original_greedy_picks g where g.player=actor and g.slot=current_slot),
    'winner',case when shown_slot=current_slot then toti_games.original_greedy_draw(current_slot,cfg.secret) else null end,
    'history',(select coalesce(jsonb_agg(jsonb_build_object('slot',h.slot,'winner',toti_games.original_greedy_draw(h.slot,cfg.secret)) order by h.slot desc),'[]')
       from generate_series(shown_slot,shown_slot-interval '270 seconds',interval '-30 seconds') h(slot) where h.slot>=cfg.starts_at),
    'records',(select coalesce(jsonb_agg(jsonb_build_object('slot',r.slot,'pick',r.food,'winner',toti_games.original_greedy_draw(r.slot,cfg.secret)) order by r.slot desc),'[]')
       from (select g.slot,g.food from toti_games.original_greedy_picks g where g.player=actor and g.slot<=shown_slot order by g.slot desc limit 30) r)
  );
end;
$$;

create function public.totichat_original_greedy_pick(p_slot timestamptz,p_food text) returns text
language plpgsql security definer set search_path='' as $$
declare actor uuid:=toti_practice_games.player(); chosen text; at_time timestamptz; active_slot timestamptz;
begin
  if p_food is null or p_food not in ('carrot','tomato','corn','broccoli','shrimp','chicken','meat','fish') then raise exception 'INVALID_GREEDY_FOOD'; end if;
  if not exists(select 1 from toti_games.original_game_config where code='greedy-original' and enabled) then raise exception 'GREEDY_UNAVAILABLE'; end if;
  perform pg_advisory_xact_lock(hashtextextended('greedy-pick:'||actor::text,0));
  select food into chosen from toti_games.original_greedy_picks where player=actor and slot=p_slot;
  if found then
    if chosen<>p_food then raise exception 'GREEDY_PICK_ALREADY_RECORDED'; end if;
    return chosen;
  end if;
  at_time:=clock_timestamp();
  active_slot:=date_bin(interval '30 seconds',at_time,timestamptz '2000-01-01 00:00:00+00');
  if p_slot is distinct from active_slot or at_time>=active_slot+interval '22 seconds' then raise exception 'GREEDY_PICK_CLOSED'; end if;
  insert into toti_games.original_greedy_picks values(actor,p_slot,p_food);
  return p_food;
end;
$$;
revoke all on function public.totichat_original_greedy_state(),public.totichat_original_greedy_pick(timestamptz,text) from public,anon,authenticated;
grant execute on function public.totichat_original_greedy_state(),public.totichat_original_greedy_pick(timestamptz,text) to authenticated;
create index original_greedy_picks_slot on toti_games.original_greedy_picks(slot);

create function public.totichat_original_greedy_leaders(p_period text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  cfg toti_games.original_game_config;
  cutoff timestamptz;
  period_start timestamptz;
begin
  perform toti_practice_games.player();
  if p_period is null or p_period not in ('day','week','month') then raise exception 'INVALID_GREEDY_PERIOD'; end if;
  select * into strict cfg from toti_games.original_game_config where code='greedy-original';
  if not cfg.enabled then return '[]'::jsonb; end if;
  period_start := date_trunc(p_period,statement_timestamp() at time zone 'Asia/Baghdad') at time zone 'Asia/Baghdad';
  cutoff := statement_timestamp() - interval '22 seconds';
  return (select coalesce(jsonb_agg(to_jsonb(l) order by l.wins desc,l.public_id),'[]'::jsonb) from (
    select p.display_name as name,p.public_id,count(*)::integer as wins
    from toti_games.original_greedy_picks g join public.profiles p on p.id=g.player
    where g.slot>=period_start and g.slot<=cutoff and g.food=toti_games.original_greedy_draw(g.slot,cfg.secret)
    group by p.id,p.display_name,p.public_id order by wins desc,p.public_id limit 20
  ) l);
end;
$$;
revoke all on function public.totichat_original_greedy_leaders(text) from public,anon,authenticated;
grant execute on function public.totichat_original_greedy_leaders(text) to authenticated;
commit;
