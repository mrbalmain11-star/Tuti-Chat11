-- Insert this test before the migration funding call. Finish the test transaction with ROLLBACK.
do $test$
declare
  player_id uuid;
  other_id uuid;
  match toti_games.ludo_matches;
  session_id uuid;
  current_slot timestamptz;
  old_slot timestamptz;
  game_code text;
  chosen integer;
  game_rows integer;
  game_risk text;
  request_id uuid;
  response jsonb;
  ledger_count bigint;
  result_after jsonb;
begin
  select v.user_id,v.session_id into strict player_id,session_id
    from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
    join public.wallets w on w.user_id=v.user_id join auth.users u on u.id=v.user_id
    where u.banned_until is null or u.banned_until <= now() limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',player_id,'role','authenticated','session_id',session_id)::text,true);
  assert not (public.games_rounds_snapshot()->>'funded')::boolean;
  assert not has_function_privilege('anon','public.games_rounds_snapshot(text)','execute');
  assert not has_function_privilege('authenticated','toti_games.resolve_round(text,timestamptz)','execute');
  assert toti_games.fund_once();
  update public.wallets set coins=2000 where user_id=player_id;
  for game_code,chosen,game_rows,game_risk in values
    ('plinko',null::integer,8,'low'),('greedy',1,null,null),('lucky_wheel',0,null,null),('slot',0,null,null),
    ('fruit',0,null,null),('roulette',0,null,null),('teen_patti',1,null,null),('crash',200,null,null)
  loop
    current_slot := (public.games_rounds_snapshot()->>'round_start')::timestamptz;
    old_slot := current_slot - interval '60 seconds';
    request_id := gen_random_uuid();
    response := public.games_join_round(request_id,game_code,current_slot,25,chosen,game_rows,game_risk);
    assert response->>'status' = 'pending';
    assert response = public.games_join_round(request_id,game_code,current_slot,25,chosen,game_rows,game_risk);
    begin
      perform toti_games.resolve_round(game_code,current_slot);
      raise exception 'early resolution was accepted';
    exception when raise_exception then if sqlerrm <> 'GAMES_ROUND_OPEN' then raise; end if;
    end;
    insert into toti_games.rounds (game,starts_at) values (game_code,old_slot);
    update toti_games.entries set starts_at=old_slot where player=player_id and entries.request_id=(response->>'request_id')::uuid;
    perform toti_games.process_due();
    result_after := public.games_rounds_snapshot(game_code);
    assert result_after->'entries'->0->>'status' = 'settled';
    assert result_after->'entries'->0->'result' = result_after->'rounds'->0->'result';
    select count(*) into ledger_count from toti_games.ledger;
    perform toti_games.resolve_round(game_code,old_slot);
    assert ledger_count = (select count(*) from toti_games.ledger);
  end loop;
  select user_id into strict other_id from public.wallets where user_id <> player_id limit 1;
  update public.wallets set coins=2000 where user_id=other_id;
  current_slot := (public.games_rounds_snapshot()->>'round_start')::timestamptz;
  old_slot := current_slot - interval '60 seconds';
  request_id := gen_random_uuid();
  perform public.games_join_round(request_id,'ludo',current_slot,10,0);
  perform toti_games.enter_round(other_id,gen_random_uuid(),'ludo',current_slot,10,20,'{"pick":0,"maximum":2}');
  insert into toti_games.rounds(game,starts_at) values('ludo',old_slot);
  update toti_games.entries set starts_at=old_slot where game='ludo' and starts_at=current_slot;
  perform toti_games.process_due();
  select * into strict match from toti_games.ludo_matches where starts_at=old_slot;
  assert match.winner is null;
  update toti_games.ludo_matches set turn=case when player_one=player_id then 1 else 2 end, die=1,
    pieces_one=case when player_one=player_id then array[55,56,56,56] else pieces_one end,
    pieces_two=case when player_two=player_id then array[55,56,56,56] else pieces_two end
    where starts_at=old_slot;
  perform public.games_ludo_move(old_slot,1,1);
  assert (public.games_rounds_snapshot('ludo')->'entries'->0->>'paid')::integer = 20;
  assert (select reserved from toti_games.treasury where singleton) = 0;
  assert (select coins from toti_games.treasury where singleton) = (select sum(delta) from toti_games.ledger);
end $test$;
