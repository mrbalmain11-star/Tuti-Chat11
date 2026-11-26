begin;

-- Keep the new game separate from historical Greedy entries (which paid 7x).
-- The existing generic admin endpoint cannot enable an unimplemented catalog entry.
insert into toti_practice_games.catalog (code) values ('toti-food');

alter table toti_games.entries
  drop constraint entries_stake_check,
  drop constraint entries_player_game_starts_at_key,
  add constraint entries_stake_check check (
    case when game = 'toti-food' then stake in (1000, 5000, 10000, 50000, 100000)
      else stake between 10 and 1000 end
  );
create unique index games_entries_single_pick on toti_games.entries (player, game, starts_at)
  where game <> 'toti-food';
create index games_food_player_round on toti_games.entries (player, starts_at desc)
  where game = 'toti-food';

create table toti_games.food_config (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
alter table toti_games.food_config enable row level security;
revoke all on toti_games.food_config from public, anon, authenticated;
insert into toti_games.food_config default values;

create function toti_games.food_multiplier(p_pick integer) returns numeric
language sql immutable set search_path = '' as $$
  select (array[10, 5, 3, 2, 1.5, 10, 5, 3]::numeric[])[p_pick + 1];
$$;
revoke all on function toti_games.food_multiplier(integer) from public, anon, authenticated;

create or replace function toti_games.enter_round(
  p_player uuid, p_request uuid, p_game text, p_start timestamptz,
  p_stake bigint, p_liability bigint, p_selection jsonb
) returns toti_games.entries
language plpgsql set search_path = '' as $$
declare
  vault toti_games.treasury;
  entry toti_games.entries;
  player_balance bigint;
  operation uuid;
begin
  select * into strict vault from toti_games.treasury where singleton for update;
  select * into entry from toti_games.entries where player = p_player and request_id = p_request;
  if found then
    if (entry.game, entry.starts_at, entry.stake, entry.liability, entry.selection)
      is distinct from (p_game, p_start, p_stake, p_liability, p_selection) then
      raise exception 'GAMES_REQUEST_CONFLICT';
    end if;
    return entry;
  end if;
  if p_start is distinct from date_bin(interval '30 seconds', clock_timestamp(), timestamptz '2000-01-01 00:00:00+00') then
    raise exception 'GAMES_ROUND_CLOSED';
  end if;
  if p_stake is null or not (case when p_game = 'toti-food' then p_stake in (1000, 5000, 10000, 50000, 100000)
      else p_stake between 10 and 1000 end) or p_liability is null or p_liability < p_stake
    or p_selection is null then raise exception 'GAMES_INVALID_ENTRY'; end if;
  if vault.coins - vault.reserved < p_liability - p_stake then raise exception 'GAMES_POOL_CAPACITY'; end if;
  insert into toti_games.rounds values (p_game, p_start) on conflict do nothing;
  update public.wallets set coins = coins - p_stake, updated_at = clock_timestamp()
    where user_id = p_player and coins >= p_stake returning coins into player_balance;
  if not found then raise exception 'GAMES_INSUFFICIENT_BALANCE'; end if;
  -- Recheck after acquiring the shared wallet lock. A concurrent wallet
  -- operation can hold it until the round closes; rollback the tentative debit.
  if clock_timestamp() >= p_start + (case when p_game = 'toti-food' then interval '12 seconds' else interval '30 seconds' end) then
    raise exception 'GAMES_ROUND_CLOSED';
  end if;
  insert into public.financial_operations (actor_id, request_id, operation, payload, status)
    values (p_player, p_request, 'games_entry', jsonb_build_object('game', p_game, 'round', p_start, 'stake', p_stake), 'pending')
    returning id into operation;
  insert into toti_games.entries (player, request_id, game, starts_at, stake, liability, selection, operation_id)
    values (p_player, p_request, p_game, p_start, p_stake, p_liability, p_selection, operation) returning * into entry;
  update toti_games.treasury set coins = coins + p_stake, reserved = reserved + p_liability
    where singleton returning * into vault;
  insert into public.wallet_ledger (user_id, currency, amount_change, balance_after, operation_id, transaction_id, kind)
    values (p_player, 'coins', -p_stake, player_balance, gen_random_uuid(), operation, 'transfer_sent');
  insert into toti_games.ledger (operation_id, kind, delta, balance_after)
    values (operation, 'stake', p_stake, vault.coins);
  return entry;
end;
$$;

create or replace function toti_games.draw(p_code text) returns jsonb
language plpgsql volatile set search_path = '' as $$
declare
  draw integer[] := '{}';
  scores integer[];
  deck integer[] := array(select generate_series(0,51));
  pick integer;
  outcome integer;
begin
  case p_code
    when 'plinko' then
      for i in 1..16 loop draw := array_append(draw,toti_games.random_below(2)); end loop;
    when 'slot','fruit' then
      for i in 1..3 loop draw := array_append(draw,toti_games.random_below(6)); end loop;
    when 'teen_patti' then
      for i in 1..9 loop
        pick := toti_games.random_below(cardinality(deck)) + 1;
        draw := array_append(draw,deck[pick]);
        deck := array_remove(deck,deck[pick]);
      end loop;
      scores := array[toti_practice_games.card_score(draw[1:3]),toti_practice_games.card_score(draw[4:6]),toti_practice_games.card_score(draw[7:9])];
      select max(score) into outcome from unnest(scores) as score;
    when 'greedy','lucky_wheel','toti-food' then outcome := toti_games.random_below(8);
    when 'roulette' then outcome := toti_games.random_below(37);
    when 'crash' then
      outcome := least(10000,greatest(100, floor(97::numeric * 65536 / (65536 - toti_games.random_below(65536)))::integer));
    else raise exception 'GAMES_UNSUPPORTED_ENGINE';
  end case;
  return jsonb_build_object('outcome',outcome,'draw',draw,'scores',scores);
end;
$$;

create or replace function toti_games.round_factor(p_code text, selection jsonb, result jsonb) returns numeric
language plpgsql stable set search_path = '' as $$
declare
  pick integer := (selection->>'pick')::integer;
  outcome integer := (result->>'outcome')::integer;
  drawn jsonb := result->'draw';
  scores jsonb := result->'scores';
  bucket integer;
begin
  case p_code
    when 'toti-food' then
      return case when outcome = pick then (selection->>'maximum')::numeric else 0 end;
    when 'greedy' then return case when outcome = pick then 7 else 0 end;
    when 'lucky_wheel' then return (array[0,0.5,1,0,2,0,4,0])[outcome+1];
    when 'roulette' then return case when outcome = pick then 36 else 0 end;
    when 'crash' then return case when outcome >= pick then pick / 100.0 else 0 end;
    when 'teen_patti' then
      return case
        when (scores->>pick)::integer <> outcome then 0
        when (select count(*) from jsonb_array_elements_text(scores) score where score::integer = outcome) > 1 then 1
        else 2.7
      end;
    when 'slot','fruit' then
      return case
        when drawn->0 = drawn->1 and drawn->1 = drawn->2 then 18
        when drawn->0 = drawn->1 or drawn->0 = drawn->2 or drawn->1 = drawn->2 then 1
        else 0
      end;
    when 'plinko' then
      select sum(step::integer) into bucket from jsonb_array_elements_text(drawn) with ordinality as d(step,i)
        where i <= (selection->>'rows')::integer;
      return (selection->'payouts'->>bucket)::numeric;
    else raise exception 'GAMES_UNSUPPORTED_ENGINE';
  end case;
end;
$$;

create function public.totichat_food_enter(p_request uuid, p_start timestamptz, p_pick integer, p_stake bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := toti_practice_games.player();
  multiplier numeric;
  entry toti_games.entries;
  selection jsonb;
begin
  if p_request is null or p_start is null or p_pick is null or p_pick not between 0 and 7
    or p_stake is null or p_stake not in (1000, 5000, 10000, 50000, 100000) then
    raise exception 'GAMES_INVALID_ENTRY';
  end if;
  multiplier := toti_games.food_multiplier(p_pick);
  selection := jsonb_build_object('pick', p_pick, 'maximum', multiplier);

  perform pg_advisory_xact_lock(hashtextextended('toti-food:' || actor::text, 0));
  select * into entry from toti_games.entries where player = actor and request_id = p_request;
  if found then
    if (entry.game, entry.starts_at, entry.stake, entry.selection->>'pick')
      is distinct from ('toti-food'::text, p_start, p_stake, p_pick::text) then
      raise exception 'GAMES_REQUEST_CONFLICT';
    end if;
    return to_jsonb(entry) - 'player' - 'operation_id';
  end if;

  if not exists (select 1 from toti_games.food_config where singleton and enabled for share) then
    raise exception 'GAMES_DISABLED';
  end if;
  if p_start is distinct from date_bin(interval '30 seconds', clock_timestamp(), timestamptz '2000-01-01 00:00:00+00')
    or clock_timestamp() >= p_start + interval '12 seconds' then
    raise exception 'GAMES_ROUND_CLOSED';
  end if;
  if (select count(*) from toti_games.entries where player = actor and game = 'toti-food' and starts_at = p_start) >= 60 then
    raise exception 'GAMES_RATE_LIMITED';
  end if;

  entry := toti_games.enter_round(actor, p_request, 'toti-food', p_start, p_stake,
    (p_stake * multiplier)::bigint, selection);
  return to_jsonb(entry) - 'player' - 'operation_id';
end;
$$;

create function toti_games.open_food_round() returns void
language sql set search_path = '' as $$
  insert into toti_games.rounds (game, starts_at)
    select 'toti-food', date_bin(interval '30 seconds', clock_timestamp(), timestamptz '2000-01-01 00:00:00+00')
    from toti_games.food_config where singleton and enabled
  on conflict do nothing;
$$;
revoke all on function toti_games.open_food_round() from public, anon, authenticated;
select cron.schedule('totichat-food-open', '5 seconds', 'select toti_games.open_food_round()');

create function public.totichat_food_state() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := toti_practice_games.player();
  now_at timestamptz := statement_timestamp();
  slot timestamptz := date_bin(interval '30 seconds', now_at, timestamptz '2000-01-01 00:00:00+00');
  month_start timestamptz := date_trunc('month', now_at, 'Asia/Baghdad');
  player_level integer;
  vip_level integer;
begin
  select public.staging_royal_level_for_xp(coalesce(sum(g.amount), 0)::bigint)
    into player_level from public.gift_events g
    join public.financial_operations f on f.id = g.id and f.status = 'completed'
    where g.sender_id = actor and phase3.level_xp_since_reset(actor, g.created_at);
  select e.tier into vip_level from public.vip_entitlements e
    where e.user_id = actor and (e.expires_at is null or e.expires_at > now_at);
  vip_level := coalesce(vip_level, 0);
  return jsonb_build_object(
    'enabled', exists(select 1 from toti_games.food_config where singleton and enabled)
      and exists(select 1 from toti_games.treasury),
    'server_time', now_at,
    'round_start', slot,
    'closes_at', slot + interval '12 seconds',
    'player', (select jsonb_build_object('public_id', p.public_id, 'name', p.display_name,
      'avatar', p.avatar_url, 'balance', w.coins)
      from public.profiles p left join public.wallets w on w.user_id = p.id where p.id = actor),
    'level', player_level,
    'vip', vip_level,
    'royal_eligible', player_level >= 100 and vip_level >= 6,
    'monthly_stake', (select coalesce(sum(stake), 0)::text from toti_games.entries
      where player = actor and game = 'toti-food' and starts_at >= month_start and status <> 'refunded'),
    'bets', (select coalesce(jsonb_object_agg(pick, total), '{}'::jsonb) from (
      select selection->>'pick' as pick, sum(stake) as total from toti_games.entries
      where player = actor and game = 'toti-food' and starts_at = slot and status = 'pending'
      group by selection->>'pick'
    ) totals),
    'rounds', (select coalesce(jsonb_agg(to_jsonb(recent) order by starts_at desc), '[]'::jsonb) from (
      select starts_at, resolved_at, result, toti_games.food_multiplier((result->>'outcome')::integer) as multiplier
      from toti_games.rounds where game = 'toti-food' and resolved_at is not null order by starts_at desc limit 10
    ) recent),
    'latest_winners', (
      with latest as (
        select starts_at from toti_games.rounds
        where game = 'toti-food' and resolved_at is not null
        order by starts_at desc limit 1
      ), payouts as (
        select e.player, sum(e.paid) as payout from toti_games.entries e
        join latest l on l.starts_at = e.starts_at
        where e.game = 'toti-food' and e.status = 'settled' and e.paid > 0
        group by e.player
      ), winners as (
        select p.public_id, p.display_name as name, p.avatar_url as avatar, t.payout
        from payouts t join public.profiles p on p.id = t.player
        order by t.payout desc, p.public_id, p.id limit 3
      )
      select jsonb_build_object(
        'round_start', (select starts_at from latest),
        'total_payout', (select coalesce(sum(payout), 0)::text from payouts),
        'players', coalesce(jsonb_agg(jsonb_build_object('public_id', public_id, 'name', name,
          'avatar', avatar, 'payout', payout::text) order by payout desc, public_id), '[]'::jsonb)
      ) from winners
    ),
    'entries', (select coalesce(jsonb_agg(to_jsonb(recent) order by starts_at desc, request_id), '[]'::jsonb) from (
      select request_id, starts_at, selection->'pick' as pick, stake, paid, status, closed_at
      from toti_games.entries where player = actor and game = 'toti-food'
      order by starts_at desc, request_id limit 100
    ) recent)
  );
end;
$$;
revoke all on function public.totichat_food_state(), public.totichat_food_enter(uuid, timestamptz, integer, bigint)
  from public, anon, authenticated;
grant execute on function public.totichat_food_state(), public.totichat_food_enter(uuid, timestamptz, integer, bigint)
  to authenticated;

-- The approved artwork labels leaderboard points as stakes. Rank settled
-- participants by accepted stake, with a stable public-ID tiebreaker.
create function public.totichat_food_leaders(p_period text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := toti_practice_games.player();
  period_start timestamptz;
begin
  if p_period is null or p_period not in ('day', 'week', 'month') then
    raise exception 'GAMES_INVALID_PERIOD';
  end if;
  period_start := date_trunc(p_period, statement_timestamp(), 'Asia/Baghdad');
  return (
    with totals as (
      select e.player, sum(e.stake) as points
      from toti_games.entries e
      where e.game = 'toti-food' and e.status = 'settled' and e.starts_at >= period_start
      group by e.player
    ), ranking as (
      select p.id, p.public_id, p.display_name as name, p.avatar_url as avatar,
        t.points::text as points, row_number() over (order by t.points desc, p.public_id, p.id) as rank
      from totals t join public.profiles p on p.id = t.player
    )
    select jsonb_build_object(
      'leaders', coalesce(jsonb_agg(to_jsonb(r) - 'id' order by rank) filter (where rank <= 10), '[]'::jsonb),
      'player', (select to_jsonb(me) - 'id' from ranking me where me.id = actor)
    )
    from ranking r
  );
end;
$$;
revoke all on function public.totichat_food_leaders(text) from public, anon, authenticated;
grant execute on function public.totichat_food_leaders(text) to authenticated;

commit;
