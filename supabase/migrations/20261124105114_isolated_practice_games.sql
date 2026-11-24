begin;

create schema toti_practice_games;
revoke all on schema toti_practice_games from public, anon, authenticated;
grant usage on schema toti_practice_games to authenticated;

alter table phase3.admin_access
  add constraint admin_access_games_permissions_check
  check (not ('games.manage' = any(permissions)) or role in ('owner', 'super_admin', 'admin'));
alter table phase3.admin_access drop constraint admin_access_permissions_check;
alter table phase3.admin_access add constraint admin_access_permissions_check check (permissions <@ array[
  'stats.read','users.manage','agencies.read','rooms.read','operations.read','ids.manage','room.moderate',
  'room.appeals','support.appeals','app_bans.manage','agency.actions','host_agency.open','reports.moderate',
  'reports.read','recharge.manage','staff.manage','banners.manage','catalog.manage','offers.manage',
  'daily_rewards.read','tester_badges.manage','games.manage'
]::text[]);

create table toti_practice_games.catalog (
  code text primary key,
  enabled boolean not null default false,
  implemented boolean not null default false,
  rules jsonb not null default '{}',
  check (not enabled or implemented)
);
insert into toti_practice_games.catalog (code) values
  ('greedy'), ('teen_patti'), ('lucky_wheel'), ('slot'), ('roulette'), ('crash'), ('fruit'), ('ludo');
insert into toti_practice_games.catalog (code, implemented, rules) values
  ('plinko', true, jsonb_build_object('min_stake', 10, 'max_stake', 1000, 'payouts', '{"low":{"8":[5.6,2.1,1.1,1,0.5,1,1.1,2.1,5.6],"9":[5.6,2,1.6,1,0.7,0.7,1,1.6,2,5.6],"10":[8.9,3,1.4,1.1,1,0.5,1,1.1,1.4,3,8.9],"11":[8.4,3,1.9,1.3,1,0.7,0.7,1,1.3,1.9,3,8.4],"12":[10,3,1.6,1.4,1.1,1,0.5,1,1.1,1.4,1.6,3,10],"13":[8.1,4,3,1.9,1.2,0.9,0.7,0.7,0.9,1.2,1.9,3,4,8.1],"14":[7.1,4,1.9,1.4,1.3,1.1,1,0.5,1,1.1,1.3,1.4,1.9,4,7.1],"15":[15,8,3,2,1.5,1.1,1,0.7,0.7,1,1.1,1.5,2,3,8,15],"16":[16,9,2,1.4,1.4,1.2,1.1,1,0.5,1,1.1,1.2,1.4,1.4,2,9,16]},"normal":{"8":[13,3,1.3,0.7,0.4,0.7,1.3,3,13],"9":[18,4,1.7,0.9,0.5,0.5,0.9,1.7,4,18],"10":[22,5,2,1.4,0.6,0.4,0.6,1.4,2,5,22],"11":[24,6,3,1.8,0.7,0.5,0.5,0.7,1.8,3,6,24],"12":[33,11,4,2,1.1,0.6,0.3,0.6,1.1,2,4,11,33],"13":[43,13,6,3,1.3,0.7,0.4,0.4,0.7,1.3,3,6,13,43],"14":[58,15,7,4,1.9,1,0.5,0.2,0.5,1,1.9,4,7,15,58],"15":[88,18,11,5,3,1.3,0.5,0.3,0.3,0.5,1.3,3,5,11,18,88],"16":[110,41,10,5,3,1.5,1,0.5,0.3,0.5,1,1.5,3,5,10,41,110]},"high":{"8":[29,4,1.5,0.3,0.2,0.3,1.5,4,29],"9":[43,7,2,0.6,0.2,0.2,0.6,2,7,43],"10":[76,10,3,0.9,0.3,0.2,0.3,0.9,3,10,76],"11":[120,14,5.2,1.4,0.4,0.2,0.2,0.4,1.4,5.2,14,120],"12":[170,24,8.1,2,0.7,0.2,0.2,0.2,0.7,2,8.1,24,170],"13":[260,37,11,4,1,0.2,0.2,0.2,0.2,1,4,11,37,260],"14":[420,56,18,5,1.9,0.3,0.2,0.2,0.2,0.3,1.9,5,18,56,420],"15":[620,83,27,8,3,0.5,0.2,0.2,0.2,0.2,0.5,3,8,27,83,620],"16":[1000,130,26,9,4,2,0.2,0.2,0.2,0.2,0.2,2,4,9,26,130,1000]}}'::jsonb));

create table toti_practice_games.wallets (
  user_id uuid primary key,
  balance bigint not null check (balance >= 0)
);
create table toti_practice_games.rounds (
  user_id uuid not null references toti_practice_games.wallets,
  request_id uuid not null,
  game_code text not null references toti_practice_games.catalog,
  stake integer not null check (stake > 0),
  risk text not null,
  rows integer not null,
  path integer[] not null,
  bucket integer not null,
  multiplier numeric not null,
  reward bigint not null check (reward >= 0),
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default clock_timestamp(),
  primary key (user_id, request_id)
);
create index practice_rounds_recent on toti_practice_games.rounds (created_at desc);
create index practice_rounds_user_recent on toti_practice_games.rounds (user_id, created_at desc);

create table toti_practice_games.ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references toti_practice_games.wallets,
  request_id uuid,
  kind text not null,
  amount bigint not null,
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default clock_timestamp(),
  foreign key (user_id, request_id) references toti_practice_games.rounds,
  unique nulls not distinct (user_id, request_id, kind),
  check ((kind = 'grant' and request_id is null and amount > 0)
      or (kind = 'stake' and request_id is not null and amount < 0)
      or (kind = 'reward' and request_id is not null and amount > 0))
);

create table toti_practice_games.admin_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  game_code text not null references toti_practice_games.catalog,
  enabled boolean not null,
  created_at timestamptz not null default clock_timestamp()
);

alter table toti_practice_games.catalog enable row level security;
alter table toti_practice_games.wallets enable row level security;
alter table toti_practice_games.rounds enable row level security;
alter table toti_practice_games.ledger enable row level security;
alter table toti_practice_games.admin_log enable row level security;
revoke all on all tables in schema toti_practice_games from public, anon, authenticated;

create function toti_practice_games.player() returns uuid
language plpgsql stable set search_path = '' as $$
declare
  player_id uuid := auth.uid();
begin
  if player_id is null or not public.otp_access_allowed()
    or not exists (select 1 from public.profiles where id = player_id) then
    raise exception 'GAMES_ACCOUNT_REQUIRED' using errcode = '42501';
  end if;
  return player_id;
end;
$$;

create function toti_practice_games.snapshot() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  player_id uuid := toti_practice_games.player();
begin
  return jsonb_build_object(
    'catalog', (select jsonb_agg(to_jsonb(c) order by code) from toti_practice_games.catalog c),
    'balance', (select balance from toti_practice_games.wallets where user_id = player_id),
    'history', coalesce((select jsonb_agg(to_jsonb(h) - 'user_id' order by h.created_at desc)
      from (select * from toti_practice_games.rounds where user_id = player_id
            order by created_at desc limit 12) h), '[]'::jsonb)
  );
end;
$$;

create function toti_practice_games.drop_ball(p_request uuid, p_stake integer, p_rows integer, p_risk text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  player_id uuid := toti_practice_games.player();
  game toti_practice_games.catalog;
  played toti_practice_games.rounds;
  initial_balance bigint;
  ball_path integer[] := '{}';
  bucket integer := 0;
  step integer;
  factor numeric;
  reward bigint;
begin
  if p_request is null or p_rows is null or p_rows not between 8 and 16
    or p_risk is null or p_risk not in ('low', 'normal', 'high') or p_stake is null then
    raise exception 'GAMES_INVALID_INPUT';
  end if;

  -- Lock even before wallet creation so retries and the starter grant serialize.
  perform pg_advisory_xact_lock(hashtextextended('toti_practice_games:' || player_id::text, 0));
  select * into played from toti_practice_games.rounds where user_id = player_id and request_id = p_request;
  if found then
    if (played.stake, played.rows, played.risk) is distinct from (p_stake, p_rows, p_risk) then
      raise exception 'GAMES_REQUEST_CONFLICT';
    end if;
    return to_jsonb(played) - 'user_id';
  end if;

  select * into strict game from toti_practice_games.catalog where code = 'plinko' for share;
  if not game.enabled then raise exception 'GAMES_DISABLED'; end if;
  if p_stake not between (game.rules->>'min_stake')::integer and (game.rules->>'max_stake')::integer then
    raise exception 'GAMES_INVALID_STAKE';
  end if;
  select balance into initial_balance from toti_practice_games.wallets where user_id = player_id for update;
  if not found then
    initial_balance := 5000;
    insert into toti_practice_games.wallets values (player_id, initial_balance);
    insert into toti_practice_games.ledger (user_id, kind, amount, balance_after)
      values (player_id, 'grant', initial_balance, initial_balance);
  end if;
  if initial_balance < p_stake then raise exception 'GAMES_INSUFFICIENT_BALANCE'; end if;

  for i in 1..p_rows loop
    step := get_byte(extensions.gen_random_bytes(1), 0) & 1;
    ball_path := array_append(ball_path, step);
    bucket := bucket + step;
  end loop;
  factor := (game.rules->'payouts'->p_risk->p_rows::text->>bucket)::numeric;
  reward := floor(p_stake * factor)::bigint;
  update toti_practice_games.wallets set balance = initial_balance - p_stake + reward where user_id = player_id;
  insert into toti_practice_games.rounds (user_id, request_id, game_code, stake, risk, rows, path, bucket, multiplier, reward, balance_after)
  values (player_id, p_request, 'plinko', p_stake, p_risk, p_rows, ball_path, bucket, factor, reward, initial_balance - p_stake + reward)
  returning * into played;
  insert into toti_practice_games.ledger (user_id, request_id, kind, amount, balance_after)
    values (player_id, p_request, 'stake', -p_stake, initial_balance - p_stake);
  if reward > 0 then
    insert into toti_practice_games.ledger (user_id, request_id, kind, amount, balance_after)
      values (player_id, p_request, 'reward', reward, played.balance_after);
  end if;
  return to_jsonb(played) - 'user_id';
end;
$$;

create function toti_practice_games.admin(p_code text, p_enabled boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := toti_practice_games.player();
begin
  if not phase3.admin_section_allowed('games.manage') then
    raise exception 'GAMES_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_code is not null then
    if p_enabled is null then raise exception 'GAMES_INVALID_INPUT'; end if;
    update toti_practice_games.catalog set enabled = p_enabled
      where code = p_code and implemented and enabled is distinct from p_enabled;
    if found then
      insert into toti_practice_games.admin_log (actor_id, game_code, enabled) values (actor_id, p_code, p_enabled);
    end if;
  end if;
  return jsonb_build_object(
    'catalog', (select jsonb_agg(to_jsonb(c) order by code) from toti_practice_games.catalog c),
    'wallets', (select count(*) from toti_practice_games.wallets),
    'balance', (select coalesce(sum(balance), 0) from toti_practice_games.wallets),
    'round_count', (select count(*) from toti_practice_games.rounds),
    'rounds', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from (select g.*, p.public_id from toti_practice_games.rounds g left join public.profiles p on p.id = g.user_id
            order by g.created_at desc limit 20) r), '[]'::jsonb),
    'ledger', coalesce((select jsonb_agg(to_jsonb(l) order by l.id desc)
      from (select g.*, p.public_id from toti_practice_games.ledger g left join public.profiles p on p.id = g.user_id
            order by g.id desc limit 20) l), '[]'::jsonb),
    'audit', coalesce((select jsonb_agg(to_jsonb(a) order by a.id desc)
      from (select g.*, p.public_id from toti_practice_games.admin_log g left join public.profiles p on p.id = g.actor_id
            order by g.id desc limit 20) a), '[]'::jsonb)
  );
end;
$$;

create function public.practice_games_snapshot() returns jsonb
language sql set search_path = '' as $$ select toti_practice_games.snapshot() $$;
create function public.practice_games_drop(p_request uuid, p_stake integer, p_rows integer, p_risk text) returns jsonb
language sql set search_path = '' as $$ select toti_practice_games.drop_ball(p_request, p_stake, p_rows, p_risk) $$;
create function public.practice_games_admin(p_code text default null, p_enabled boolean default null) returns jsonb
language sql set search_path = '' as $$ select toti_practice_games.admin(p_code, p_enabled) $$;

revoke all on all functions in schema toti_practice_games from public, anon, authenticated;
revoke all on function public.practice_games_snapshot(), public.practice_games_drop(uuid, integer, integer, text),
  public.practice_games_admin(text, boolean) from public, anon, authenticated;
grant execute on function public.practice_games_snapshot(), public.practice_games_drop(uuid, integer, integer, text),
  public.practice_games_admin(text, boolean), toti_practice_games.snapshot(), toti_practice_games.drop_ball(uuid, integer, integer, text),
  toti_practice_games.admin(text, boolean) to authenticated;

commit;
