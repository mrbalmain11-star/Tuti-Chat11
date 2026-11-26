begin;

alter table toti_practice_games.rounds add column arcade jsonb;

create or replace function toti_practice_games.drop_ball(p_request uuid, p_stake integer, p_rows integer, p_risk text)
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
    if played.game_code <> 'plinko' or (played.stake, played.rows, played.risk) is distinct from (p_stake, p_rows, p_risk) then
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

create function toti_practice_games.card_score(cards integer[]) returns integer
language plpgsql immutable set search_path = '' as $$
declare
  ranks integer[];
  flush boolean;
  straight integer;
  category integer;
  tiebreak integer;
begin
  select array_agg(card % 13 + 2 order by card % 13 desc), count(distinct card / 13) = 1
  into ranks, flush from unnest(cards) as card;
  straight := case
    when ranks = array[14,3,2] then 13
    when ranks[1] - ranks[2] = 1 and ranks[2] - ranks[3] = 1 then ranks[1] + case when ranks[1] = 14 then 0 else -1 end
  end;
  category := case when ranks[1] = ranks[3] then 5
    when flush and straight is not null then 4 when straight is not null then 3
    when flush then 2 when ranks[1] = ranks[2] or ranks[2] = ranks[3] then 1 else 0 end;
  tiebreak := case
    when straight is not null then straight
    when category = 1 then ranks[2] * 16 + case when ranks[1] = ranks[2] then ranks[3] else ranks[1] end
    else ranks[1] * 256 + ranks[2] * 16 + ranks[3] end;
  return category * 4096 + tiebreak;
end;
$$;

create function toti_practice_games.play_arcade(p_code text, p_request uuid, p_stake integer, p_pick integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  player_id uuid := toti_practice_games.player();
  played toti_practice_games.rounds;
  game toti_practice_games.catalog;
  initial_balance bigint;
  winnings bigint;
  factor numeric := 0;
  values_drawn integer[];
  outcome integer;
  hand_scores integer[];
begin
  if p_request is null or p_stake is null or p_pick is null or p_code is null or not (
    (p_code in ('slot','fruit','lucky_wheel') and p_pick = 0)
    or (p_code = 'roulette' and p_pick between 0 and 36)
    or (p_code = 'greedy' and p_pick between 0 and 7)
    or (p_code = 'teen_patti' and p_pick between 0 and 2)
    or (p_code = 'crash' and p_pick between 125 and 1000)
  ) then raise exception 'GAMES_INVALID_INPUT'; end if;

  perform pg_advisory_xact_lock(hashtextextended('toti_practice_games:' || player_id::text, 0));
  select * into played from toti_practice_games.rounds where user_id = player_id and request_id = p_request;
  if found then
    if (played.game_code, played.stake, (played.arcade->>'pick')::integer)
      is distinct from (p_code, p_stake, p_pick) then raise exception 'GAMES_REQUEST_CONFLICT'; end if;
    return to_jsonb(played) - 'user_id';
  end if;

  select * into strict game from toti_practice_games.catalog where code = p_code for share;
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

  case p_code
    when 'greedy' then
      outcome := floor(random() * 8)::integer;
      factor := case when outcome = p_pick then 7 else 0 end;
    when 'lucky_wheel' then
      outcome := floor(random() * 8)::integer;
      factor := (array[0,0.5,1,0,2,0,4,0])[outcome + 1];
    when 'roulette' then
      outcome := floor(random() * 37)::integer;
      factor := case when outcome = p_pick then 36 else 0 end;
    when 'crash' then
      outcome := least(10000, greatest(100, floor(97 / greatest(0.0001, 1 - random()))::integer));
      factor := case when outcome >= p_pick then p_pick / 100.0 else 0 end;
    when 'teen_patti' then
      values_drawn := array(select card from generate_series(0,51) as d(card) order by random() limit 9);
      hand_scores := array[
        toti_practice_games.card_score(values_drawn[1:3]),
        toti_practice_games.card_score(values_drawn[4:6]),
        toti_practice_games.card_score(values_drawn[7:9])
      ];
      select max(score) into outcome from unnest(hand_scores) as score;
      if hand_scores[p_pick + 1] = outcome then
        factor := case when (select count(*) from unnest(hand_scores) as score where score = outcome) > 1 then 1 else 2.7 end;
      end if;
    else
      values_drawn := array(select floor(random() * 6)::integer from generate_series(1, 3));
      outcome := values_drawn[1];
      if values_drawn[1] = values_drawn[2] and values_drawn[1] = values_drawn[3] then
        factor := 18;
      elsif values_drawn[1] = values_drawn[2] or values_drawn[1] = values_drawn[3] or values_drawn[2] = values_drawn[3] then
        factor := 1;
      end if;
  end case;

  winnings := floor(p_stake * factor)::bigint;
  update toti_practice_games.wallets set balance = initial_balance - p_stake + winnings where user_id = player_id;
  insert into toti_practice_games.rounds (user_id, request_id, game_code, stake, risk, rows, path, bucket, multiplier, reward, balance_after, arcade)
  values (player_id, p_request, p_code, p_stake, 'arcade', 0, '{}', 0, factor, winnings,
    initial_balance - p_stake + winnings, jsonb_build_object('pick',p_pick,'outcome',outcome,'draw',values_drawn,'scores',hand_scores))
  returning * into played;
  insert into toti_practice_games.ledger (user_id, request_id, kind, amount, balance_after)
  values (player_id, p_request, 'stake', -p_stake, initial_balance - p_stake);
  if winnings > 0 then
    insert into toti_practice_games.ledger (user_id, request_id, kind, amount, balance_after)
    values (player_id, p_request, 'reward', winnings, played.balance_after);
  end if;
  return to_jsonb(played) - 'user_id';
end;
$$;

create function public.practice_games_play(p_code text, p_request uuid, p_stake integer, p_pick integer)
returns jsonb language sql set search_path = '' as $$
  select toti_practice_games.play_arcade(p_code, p_request, p_stake, p_pick);
$$;

revoke all on function toti_practice_games.card_score(integer[]),
  toti_practice_games.play_arcade(text,uuid,integer,integer), public.practice_games_play(text,uuid,integer,integer)
from public, anon, authenticated;
grant execute on function toti_practice_games.play_arcade(text,uuid,integer,integer),
  public.practice_games_play(text,uuid,integer,integer) to authenticated;

update toti_practice_games.catalog
set enabled = true, implemented = true, rules = jsonb_build_object('min_stake', 10, 'max_stake', 1000)
where code in ('greedy','teen_patti','lucky_wheel','slot','roulette','crash','fruit');

update toti_practice_games.catalog set enabled = true, implemented = true where code = 'ludo';

create function public.practice_games_snapshot_v2() returns jsonb
language sql set search_path = '' as $$ select toti_practice_games.snapshot() $$;

revoke all on function public.practice_games_snapshot_v2() from public, anon, authenticated;
grant execute on function public.practice_games_snapshot_v2() to authenticated;

-- Older clients send every enabled tile to Plinko. Keep their catalog Plinko-only.
create or replace function public.practice_games_snapshot() returns jsonb
language sql set search_path = '' as $$
  with data as materialized (select toti_practice_games.snapshot() as value)
  select jsonb_build_object(
    'balance', value->'balance',
    'catalog', (select jsonb_agg(case when game->>'code' = 'plinko' then game
      else game || '{"enabled": false, "implemented": false}'::jsonb end order by game->>'code')
      from jsonb_array_elements(value->'catalog') as game),
    'history', (select coalesce(jsonb_agg(round), '[]'::jsonb)
      from jsonb_array_elements(value->'history') as round where round->>'game_code' = 'plinko')
  ) from data
$$;

commit;
