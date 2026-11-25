-- Run in the same transaction as the migration and roll back all fixture writes.
do $test$
declare
  player_id uuid;
  owner_id uuid;
  owner_session uuid;
  report jsonb;
  initial_treasury bigint;
  start_slot timestamptz;
  old_slot timestamptz;
  prior_month date := (date_trunc('month', current_timestamp at time zone 'Asia/Baghdad') - interval '1 month')::date;
  loss_request uuid := gen_random_uuid();
  win_request uuid := gen_random_uuid();
  refund_request uuid := gen_random_uuid();
  before_row toti_games.entries;
  after_row toti_games.entries;
  monthly_row toti_games.monthly;
begin
  select sa.owner_id, t.coins into strict owner_id, initial_treasury
    from phase3.system_authority sa join phase3.treasury_accounts t on t.user_id = sa.owner_id where sa.singleton;
  select user_id into strict player_id from public.wallets where user_id <> owner_id limit 1;
  update public.wallets set coins = 2000 where user_id = player_id;
  assert toti_games.fund_once();
  assert not toti_games.fund_once();
  assert (select coins from phase3.treasury_accounts where user_id = owner_id) = initial_treasury - 5000000;
  assert not has_function_privilege('anon','public.games_treasury_report()','execute');
  assert not has_schema_privilege('authenticated', 'toti_games', 'usage');
  assert not has_table_privilege('authenticated', 'toti_games.ledger', 'update');
  assert not has_function_privilege('authenticated', 'toti_games.close_entry(uuid,uuid,bigint,boolean)', 'execute');

  start_slot := date_bin(interval '30 seconds', clock_timestamp(), timestamptz '2000-01-01 00:00:00+00');
  old_slot := (prior_month::timestamp at time zone 'Asia/Baghdad') + interval '1 day';
  before_row := toti_games.enter_round(player_id, loss_request, 'roulette', start_slot, 100, 3600, '{"pick":1}');
  after_row := toti_games.enter_round(player_id, loss_request, 'roulette', start_slot, 100, 3600, '{"pick":1}');
  assert before_row = after_row;
  begin
    perform toti_games.enter_round(player_id, loss_request, 'roulette', start_slot, 101, 3600, '{"pick":1}');
    raise exception 'expected request conflict';
  exception when raise_exception then
    if sqlerrm <> 'GAMES_REQUEST_CONFLICT' then raise; end if;
  end;
  begin
    perform toti_games.enter_round(player_id, gen_random_uuid(), 'roulette', start_slot, 100, 3600, '{"pick":1}');
    raise exception 'expected duplicate entry rejection';
  exception when unique_violation then null;
  end;
  begin
    perform toti_games.enter_round(player_id, gen_random_uuid(), 'ludo', start_slot, 10, 6000000, '{}');
    raise exception 'expected pool capacity rejection';
  exception when raise_exception then
    if sqlerrm <> 'GAMES_POOL_CAPACITY' then raise; end if;
  end;

  perform toti_games.enter_round(player_id, win_request, 'slot', start_slot, 100, 500, '{}');
  perform toti_games.enter_round(player_id, refund_request, 'crash', start_slot, 100, 1000, '{}');
  assert (select coins from public.wallets where user_id = player_id) = 1700;
  assert (select reserved from toti_games.treasury where singleton) = 5100;
  begin
    perform toti_games.enter_round(player_id, gen_random_uuid(), 'lucky_wheel', start_slot - interval '30 seconds', 10, 40, '{}');
    raise exception 'expected closed round rejection';
  exception when raise_exception then
    if sqlerrm <> 'GAMES_ROUND_CLOSED' then raise; end if;
  end;
  begin
    perform toti_games.close_entry(player_id, win_request, 501, false);
    raise exception 'expected liability rejection';
  exception when raise_exception then
    if sqlerrm <> 'GAMES_INVALID_SETTLEMENT' then raise; end if;
  end;
  assert (select coins from public.wallets where user_id = player_id) = 1700;


  -- Model historical settled entries without waiting for a real month to close.
  insert into toti_games.rounds values ('roulette', old_slot), ('slot', old_slot);
  update toti_games.entries set starts_at = old_slot where request_id in (loss_request, win_request);
  update toti_games.treasury set funded_at = old_slot where singleton;
  perform toti_games.close_entry(player_id, loss_request, 0, false);
  before_row := toti_games.close_entry(player_id, win_request, 150, false);
  after_row := toti_games.close_entry(player_id, win_request, 150, false);
  assert before_row = after_row;
  begin
    perform toti_games.close_entry(player_id, win_request, 151, false);
    raise exception 'expected inconsistent payout rejection';
  exception when raise_exception then
    if sqlerrm <> 'GAMES_SETTLEMENT_CONFLICT' then raise; end if;
  end;
  perform toti_games.close_entry(player_id, refund_request, null, true);
  perform toti_games.close_entry(player_id, refund_request, null, true);
  assert (select coins from public.wallets where user_id = player_id) = 1950;
  assert (select reserved from toti_games.treasury where singleton) = 0;
  assert (select coins from toti_games.treasury where singleton) = 5000050;
  assert (select sum(delta) from toti_games.ledger) = 5000050;

  monthly_row := toti_games.close_month(prior_month);
  assert monthly_row.net = 50 and monthly_row.transferred = 10;
  assert monthly_row = toti_games.close_month(prior_month);
  assert (select coins from toti_games.treasury where singleton) = 5000040;
  assert (select coins from phase3.treasury_accounts where user_id = owner_id) = initial_treasury - 4999990;
  select s.id into strict owner_session from otp_private.verified_sessions v
    join auth.sessions s on s.id = v.session_id and s.user_id = v.user_id
    where v.user_id = owner_id limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','session_id',owner_session)::text,true);
  report := public.games_treasury_report();
  assert report->'treasury'->>'coins' = '5000040';
  assert report->'totals'->>'player_losses' = '100' and report->'totals'->>'player_profits' = '50';
  assert report->>'distributed' = '10';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',player_id,'role','authenticated')::text,true);
  begin
    perform public.games_treasury_report();
    raise exception 'expected admin denial';
  exception when insufficient_privilege then null;
  end;
end $test$;
