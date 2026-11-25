do $test$
declare actor uuid; sid uuid; wallet_before bigint; snapshot jsonb; active_slot timestamptz; seconds integer;
begin
 select v.user_id,v.session_id,w.coins into strict actor,sid,wallet_before
 from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
 join public.wallets w on w.user_id=v.user_id join auth.users u on u.id=v.user_id
 where u.banned_until is null or u.banned_until<=now() limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','session_id',sid)::text,true);
 snapshot := public.totichat_original_greedy_state();
 assert snapshot->'player'->>'id'=actor::text;
 assert (snapshot->'player'->>'coins')::bigint=wallet_before;
 assert jsonb_array_length(snapshot->'history')<=10;
 assert jsonb_typeof(public.totichat_original_greedy_leaders('day'))='array';
 seconds := floor(extract(epoch from clock_timestamp()))::bigint%30;
 if seconds>=20 then perform pg_sleep(31-seconds); end if;
 active_slot := date_bin(interval '30 seconds',clock_timestamp(),timestamptz '2000-01-01 00:00:00+00');
 assert public.totichat_original_greedy_pick(active_slot,'fish')='fish';
 assert public.totichat_original_greedy_pick(active_slot,'fish')='fish';
 begin
  perform public.totichat_original_greedy_pick(active_slot,'carrot');
  raise exception 'duplicate pick changed';
 exception when raise_exception then if sqlerrm<>'GREEDY_PICK_ALREADY_RECORDED' then raise; end if;
 end;
 begin
  perform public.totichat_original_greedy_pick(active_slot-interval '30 seconds','fish');
  raise exception 'old slot accepted';
 exception when raise_exception then if sqlerrm<>'GREEDY_PICK_CLOSED' then raise; end if;
 end;
 assert (select coins from public.wallets where user_id=actor)=wallet_before;
 assert not has_function_privilege('anon','public.totichat_original_greedy_state()','execute');
 assert (select count(*) from toti_games.original_greedy_picks where player=actor)=1;
end $test$;
