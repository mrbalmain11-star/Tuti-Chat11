begin;

alter table toti_games.rounds add column result jsonb;
alter table toti_games.rounds add column resolved_at timestamptz;
alter table toti_games.rounds add constraint games_result_has_time check ((result is null) = (resolved_at is null));
create index games_unresolved_rounds on toti_games.rounds (starts_at, game) where resolved_at is null;
create index games_pending_entries on toti_games.entries (game, starts_at) where status = 'pending';

-- Rejection sampling keeps each of the upper possible values equally likely.
create function toti_games.random_below(upper_bound integer) returns integer
language plpgsql volatile set search_path = '' as $$
declare value integer;
begin
  if upper_bound is null or upper_bound not between 1 and 65536 then
    raise exception 'GAMES_RANDOM_BOUND';
  end if;
  loop
    value := ('x' || encode(extensions.gen_random_bytes(2),'hex'))::bit(16)::integer;
    if value < 65536 - (65536 % upper_bound) then return value % upper_bound; end if;
  end loop;
end;
$$;

create function toti_games.draw(p_code text) returns jsonb
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
    when 'greedy','lucky_wheel' then outcome := toti_games.random_below(8);
    when 'roulette' then outcome := toti_games.random_below(37);
    when 'crash' then
      outcome := least(10000,greatest(100, floor(97::numeric * 65536 / (65536 - toti_games.random_below(65536)))::integer));
    else raise exception 'GAMES_UNSUPPORTED_ENGINE';
  end case;
  return jsonb_build_object('outcome',outcome,'draw',draw,'scores',scores);
end;
$$;

create function toti_games.round_factor(p_code text, selection jsonb, result jsonb) returns numeric
language plpgsql stable set search_path = '' as $$
declare
  pick integer := (selection->>'pick')::integer;
  outcome integer := (result->>'outcome')::integer;
  drawn jsonb := result->'draw';
  scores jsonb := result->'scores';
  bucket integer;
begin
  case p_code
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

create function toti_games.quote(p_code text, p_pick integer, p_rows integer, p_risk text)
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  payouts jsonb;
  factor numeric;
begin
  if p_code = 'plinko' then
    if p_pick is not null or p_rows is null or p_rows not between 8 and 16
      or p_risk is null or p_risk not in ('low','normal','high') then raise exception 'GAMES_INVALID_INPUT'; end if;
    select rules->'payouts'->p_risk->p_rows::text into payouts
      from toti_practice_games.catalog where code = 'plinko';
    if payouts is null then raise exception 'GAMES_INVALID_RULES'; end if;
    select max(value::numeric) into factor from jsonb_array_elements_text(payouts) as value;
    return jsonb_build_object('rows',p_rows,'risk',p_risk,'payouts',payouts,'maximum',greatest(factor,1));
  end if;
  if p_rows is not null or p_risk is not null or p_pick is null then raise exception 'GAMES_INVALID_INPUT'; end if;
  factor := case
    when p_code = 'ludo' and p_pick = 0 then 2
    when p_code in ('slot','fruit') and p_pick = 0 then 18
    when p_code = 'lucky_wheel' and p_pick = 0 then 4
    when p_code = 'greedy' and p_pick between 0 and 7 then 7
    when p_code = 'teen_patti' and p_pick between 0 and 2 then 2.7
    when p_code = 'roulette' and p_pick between 0 and 36 then 36
    when p_code = 'crash' and p_pick between 125 and 1000 then p_pick / 100.0
  end;
  if factor is null then raise exception 'GAMES_INVALID_INPUT'; end if;
  return jsonb_build_object('pick',p_pick,'maximum',factor);
end;
$$;

create function toti_games.join_round(
  p_request uuid, p_code text, p_start timestamptz, p_stake bigint,
  p_pick integer, p_rows integer, p_risk text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := toti_practice_games.player();
  selection jsonb;
  entry toti_games.entries;
begin
  if p_code = 'ludo' then perform 1 from toti_games.treasury where singleton for update; end if;
  select * into entry from toti_games.entries e where e.player = caller_id and e.request_id = p_request;
  if found then
    if (entry.game,entry.starts_at,entry.stake,entry.selection->>'pick',entry.selection->>'rows',entry.selection->>'risk')
      is distinct from (p_code,p_start,p_stake,p_pick::text,p_rows::text,p_risk) then
      raise exception 'GAMES_REQUEST_CONFLICT';
    end if;
    return to_jsonb(entry) - 'player';
  end if;
  if not exists (select 1 from toti_games.treasury) then raise exception 'GAMES_NOT_FUNDED'; end if;
  if not exists (select 1 from toti_practice_games.catalog where code = p_code and enabled) then
    raise exception 'GAMES_DISABLED';
  end if;
  if p_code = 'ludo' then
    if exists(select 1 from toti_games.entries where game='ludo' and player=caller_id and status='pending') then
      raise exception 'GAMES_LUDO_ALREADY_ACTIVE';
    end if;
    if p_stake is distinct from 10 then raise exception 'GAMES_INVALID_ENTRY'; end if;
    if (select count(*) from toti_games.entries where game='ludo' and starts_at=p_start) >= 2 then
      raise exception 'GAMES_LUDO_FULL';
    end if;
  end if;
  selection := toti_games.quote(p_code,p_pick,p_rows,p_risk);
  entry := toti_games.enter_round(caller_id,p_request,p_code,p_start,p_stake,
    floor(p_stake * (selection->>'maximum')::numeric)::bigint,selection);
  return to_jsonb(entry) - 'player';
end;
$$;

create function toti_games.resolve_round(p_game text, p_start timestamptz) returns void
language plpgsql set search_path = '' as $$
declare
  current_round toti_games.rounds;
  entry toti_games.entries;
  outcome jsonb;
  payout bigint;
begin
  if p_start + interval '30 seconds' > clock_timestamp() then raise exception 'GAMES_ROUND_OPEN'; end if;
  -- The treasury lock orders this operation with all debits and reservations.
  perform 1 from toti_games.treasury where singleton for update;
  select * into strict current_round from toti_games.rounds r where r.game = p_game and r.starts_at = p_start for update;
  if current_round.resolved_at is not null then return; end if;
  begin
    outcome := toti_games.draw(p_game);
    for entry in select * from toti_games.entries e where e.game = p_game and e.starts_at = p_start
          and e.status = 'pending' order by e.player loop
      payout := floor(entry.stake * toti_games.round_factor(p_game,entry.selection,outcome))::bigint;
      perform toti_games.close_entry(entry.player,entry.request_id,payout,false);
    end loop;
  exception when others then
    raise warning 'Game round refunded after settlement failure (%): %', sqlstate, sqlerrm;
    -- The exception block rolls back every payout before any refund is applied.
    outcome := jsonb_build_object('refunded',true);
    for entry in select * from toti_games.entries e where e.game = p_game and e.starts_at = p_start
          and e.status = 'pending' order by e.player loop
      perform toti_games.close_entry(entry.player,entry.request_id,null,true);
    end loop;
  end;
  update toti_games.rounds set result = outcome,resolved_at = clock_timestamp()
    where game = p_game and starts_at = p_start;
end;
$$;

create table toti_games.ludo_matches (
  starts_at timestamptz primary key,
  player_one uuid not null,
  player_two uuid not null,
  pieces_one integer[] not null default array[-1,-1,-1,-1],
  pieces_two integer[] not null default array[-1,-1,-1,-1],
  turn integer not null check (turn in (1,2)),
  die integer not null check (die between 1 and 6),
  turn_number integer not null default 1,
  deadline timestamptz not null,
  winner integer check (winner in (0,1,2)),
  check (player_one <> player_two)
);
alter table toti_games.ludo_matches enable row level security;
revoke all on toti_games.ludo_matches from public, anon, authenticated;

create function toti_games.ludo_finish(p_start timestamptz, p_winner integer) returns void
language plpgsql set search_path = '' as $$
declare
  match toti_games.ludo_matches;
  entry toti_games.entries;
begin
  select * into match from toti_games.ludo_matches where starts_at = p_start for update;
  for entry in select * from toti_games.entries where game = 'ludo' and starts_at = p_start
    and status = 'pending' order by player loop
    perform toti_games.close_entry(entry.player,entry.request_id,
      case when entry.player = case p_winner when 1 then match.player_one when 2 then match.player_two end then entry.stake * 2 else 0 end,
      p_winner = 0);
  end loop;
  update toti_games.ludo_matches set winner = p_winner where starts_at = p_start;
  update toti_games.rounds set result = jsonb_build_object('winner',p_winner,'refunded',p_winner = 0),
    resolved_at = clock_timestamp() where game = 'ludo' and starts_at = p_start;
end;
$$;

create function toti_games.ludo_advance(p_start timestamptz, p_turn integer, p_piece integer, p_timeout boolean) returns void
language plpgsql set search_path = '' as $$
declare
  match toti_games.ludo_matches;
  pieces integer[];
  opponent integer[];
  options integer[];
  next_position integer;
  square integer;
  board_offset integer;
  next_turn integer;
  next_winner integer;
begin
  perform 1 from toti_games.treasury where singleton for update;
  select * into strict match from toti_games.ludo_matches where starts_at = p_start for update;
  if match.winner is not null or match.turn_number <> p_turn then raise exception 'GAMES_LUDO_TURN_CHANGED'; end if;
  if p_timeout <> (clock_timestamp() >= match.deadline) then raise exception 'GAMES_LUDO_TURN_CHANGED'; end if;
  pieces := case match.turn when 1 then match.pieces_one else match.pieces_two end;
  opponent := case match.turn when 1 then match.pieces_two else match.pieces_one end;
  board_offset := (match.turn - 1) * 26;
  select coalesce(array_agg(i order by pieces[i] desc,i), '{}') into options from generate_subscripts(pieces,1) as i
    where (pieces[i] = -1 and match.die = 6)
      or (pieces[i] >= 0 and pieces[i] + match.die <= 56);
  if p_timeout then p_piece := options[1]; end if;
  if cardinality(options) = 0 then
    if p_piece is not null then raise exception 'GAMES_LUDO_INVALID_MOVE'; end if;
    next_turn := 3 - match.turn;
  else
    if p_piece is null or not (p_piece = any(options)) then raise exception 'GAMES_LUDO_INVALID_MOVE'; end if;
    next_position := case when pieces[p_piece] = -1 then 0 else pieces[p_piece] + match.die end;
    pieces[p_piece] := next_position;
    square := (next_position + board_offset) % 52;
    if next_position < 51 and square not in (0,8,13,21,26,34,39,47) then
      for i in 1..4 loop
        if opponent[i] between 0 and 50 and (opponent[i] + 26 - board_offset) % 52 = square then opponent[i] := -1; end if;
      end loop;
    end if;
    next_turn := case when match.die = 6 then match.turn else 3 - match.turn end;
  end if;
  if pieces = array[56,56,56,56] then next_winner := match.turn;
  elsif match.turn_number >= 240 then next_winner := 0; end if;
  update toti_games.ludo_matches set
    pieces_one = case match.turn when 1 then pieces else opponent end,
    pieces_two = case match.turn when 2 then pieces else opponent end,
    turn = next_turn, die = toti_games.random_below(6)+1,
    turn_number = match.turn_number+1, deadline = clock_timestamp()+interval '30 seconds'
    where starts_at = p_start;
  if next_winner is not null then perform toti_games.ludo_finish(p_start,next_winner); end if;
end;
$$;

create function toti_games.resolve_ludo(p_start timestamptz) returns void
language plpgsql set search_path = '' as $$
declare
  players uuid[];
  match toti_games.ludo_matches;
begin
  if p_start + interval '30 seconds' > clock_timestamp() then raise exception 'GAMES_ROUND_OPEN'; end if;
  perform 1 from toti_games.treasury where singleton for update;
  if exists(select 1 from toti_games.rounds where game = 'ludo' and starts_at = p_start and resolved_at is not null) then return; end if;
  select * into match from toti_games.ludo_matches where starts_at = p_start;
  if found then
    if match.deadline <= clock_timestamp() then perform toti_games.ludo_advance(p_start,match.turn_number,null,true); end if;
    return;
  end if;
  select array_agg(player order by player) into players from toti_games.entries
    where game = 'ludo' and starts_at = p_start and status = 'pending';
  if coalesce(cardinality(players),0) <> 2 then
    perform toti_games.ludo_finish(p_start,0);
    return;
  end if;
  insert into toti_games.ludo_matches (starts_at,player_one,player_two,turn,die,deadline)
    values (p_start,players[1],players[2],toti_games.random_below(2)+1,toti_games.random_below(6)+1,clock_timestamp()+interval '30 seconds');
end;
$$;

create function public.games_ludo_move(p_start timestamptz,p_turn integer,p_piece integer default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := toti_practice_games.player();
  match toti_games.ludo_matches;
begin
  perform 1 from toti_games.treasury where singleton for update;
  select * into match from toti_games.ludo_matches where starts_at = p_start;
  if not found or caller_id <> (case match.turn when 1 then match.player_one else match.player_two end) then
    raise exception 'GAMES_LUDO_NOT_YOUR_TURN' using errcode='42501';
  end if;
  perform toti_games.ludo_advance(p_start,p_turn,p_piece,false);
end;
$$;
revoke all on function public.games_ludo_move(timestamptz,integer,integer) from public,anon,authenticated;
grant execute on function public.games_ludo_move(timestamptz,integer,integer) to authenticated;

create function toti_games.process_due() returns void
language plpgsql set search_path = '' as $$
declare
  slot toti_games.rounds;
  month_to_close date;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('toti_games:worker',0)) then return; end if;
  for slot in select * from toti_games.rounds where resolved_at is null
    and starts_at + interval '30 seconds' <= clock_timestamp()
    and (game <> 'ludo' or not exists (select 1 from toti_games.ludo_matches m
      where m.starts_at = rounds.starts_at and m.winner is null and m.deadline > clock_timestamp()))
    order by starts_at,game limit 16 loop
    begin
      if slot.game = 'ludo' then perform toti_games.resolve_ludo(slot.starts_at);
      else perform toti_games.resolve_round(slot.game,slot.starts_at); end if;
    exception when others then
      raise warning 'Game worker will retry round (%): %', sqlstate, sqlerrm;
    end;
  end loop;
  select coalesce((select (max(month)+interval '1 month')::date from toti_games.monthly),
    date_trunc('month',funded_at at time zone 'Asia/Baghdad')::date)
    into month_to_close from toti_games.treasury where singleton;
  if month_to_close < date_trunc('month',clock_timestamp() at time zone 'Asia/Baghdad')::date
    and not exists (select 1 from toti_games.entries where status = 'pending'
      and starts_at < ((month_to_close + interval '1 month') at time zone 'Asia/Baghdad')) then
    begin perform toti_games.close_month(month_to_close);
    exception when others then raise warning 'Game worker will retry monthly close (%): %', sqlstate, sqlerrm;
    end;
  end if;
end;
$$;

create extension if not exists pg_cron;
select cron.schedule('totichat-games-settlement', '10 seconds', 'select toti_games.process_due()');

create function public.games_join_round(
  p_request uuid, p_code text, p_start timestamptz, p_stake bigint,
  p_pick integer default null, p_rows integer default null, p_risk text default null
) returns jsonb language sql security definer set search_path = '' as $$
  select toti_games.join_round(p_request,p_code,p_start,p_stake,p_pick,p_rows,p_risk);
$$;

create function public.games_rounds_snapshot(p_code text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  player_id uuid := toti_practice_games.player();
  server_time timestamptz := statement_timestamp();
  slot timestamptz := date_bin(interval '30 seconds',server_time,timestamptz '2000-01-01 00:00:00+00');
  funded boolean := exists(select 1 from toti_games.treasury);
begin
  return jsonb_build_object(
    'server_time',server_time,'round_start',slot,'closes_at',slot + interval '30 seconds',
    'balance',(select coins from public.wallets where user_id = player_id),
    'funded',funded,
    'catalog',(select jsonb_agg(jsonb_build_object('code',code,'enabled', funded and enabled,'rules',rules) order by code)
      from toti_practice_games.catalog),
    'ludo', (select jsonb_build_object('starts_at',m.starts_at,'pieces_one',m.pieces_one,'pieces_two',m.pieces_two,
      'seat',case when m.player_one=player_id then 1 else 2 end,'turn',m.turn,'die',m.die,'turn_number',m.turn_number,'deadline',m.deadline)
      from toti_games.ludo_matches m where p_code='ludo' and m.winner is null and player_id in (m.player_one,m.player_two)
      order by m.starts_at desc limit 1),
    'entries', (select coalesce(jsonb_agg(to_jsonb(a) - 'player' order by a.starts_at desc),'[]')
      from (select e.*, r.result from toti_games.entries e join toti_games.rounds r using (game,starts_at)
        where e.player = player_id and e.game = p_code order by e.starts_at desc limit 10) a),
    'rounds', (select coalesce(jsonb_agg(to_jsonb(a) order by a.starts_at desc),'[]')
      from (select starts_at,result from toti_games.rounds where game = p_code and resolved_at is not null
        order by starts_at desc limit 10) a)
  );
end;
$$;

revoke all on all functions in schema toti_games from public, anon, authenticated;
revoke all on function public.games_join_round(uuid,text,timestamptz,bigint,integer,integer,text),
  public.games_rounds_snapshot(text) from public, anon, authenticated;
grant execute on function public.games_join_round(uuid,text,timestamptz,bigint,integer,integer,text),
  public.games_rounds_snapshot(text) to authenticated;

select toti_games.fund_once();

commit;
