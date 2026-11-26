do $test$
declare
  actor uuid;
  sid uuid;
  balance_before bigint;
  draw jsonb;
  request_id uuid := gen_random_uuid();
begin
  select v.user_id,v.session_id,w.coins into strict actor,sid,balance_before
  from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
  join public.wallets w on w.user_id=v.user_id join auth.users u on u.id=v.user_id
  where (u.banned_until is null or u.banned_until<=now()) limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','session_id',sid)::text,true);
  assert public.totichat_embedded_state('royal-cars')->'player'->>'id'=actor::text;
  draw:=public.totichat_embedded_play('royal-cars',request_id,'bmw');
  assert (draw->>'slot')::integer between 0 and 15;
  assert draw=public.totichat_embedded_play('royal-cars',request_id,'vw');
  begin
    perform public.totichat_embedded_play('royal-cars',gen_random_uuid(),'bmw');
    raise exception 'cooldown missed';
  exception when raise_exception then if sqlerrm<>'PLAY_COOLDOWN' then raise; end if;
  end;
  draw:=public.totichat_embedded_play('fortune-gem',request_id,'ex');
  assert jsonb_array_length(draw->'grid')=3 and jsonb_array_length(draw->'grid'->0)=3;
  assert jsonb_array_length(draw->'bonus')=3 and not (draw->'bonus' ? '1x');
  assert (select coins from public.wallets where user_id=actor)=balance_before;
  assert not has_function_privilege('anon','public.totichat_embedded_play(text,uuid,text)','execute');
  assert not has_table_privilege('authenticated','toti_games.embedded_plays','insert');
  if not coalesce(phase3.admin_section_allowed('games.manage'),false) then
    begin
      perform public.totichat_embedded_admin();
      raise exception 'admin access granted';
    exception when insufficient_privilege then null;
    end;
  end if;
  update toti_games.embedded_catalog set maintenance=true where code='fortune-gem';
  begin
    perform public.totichat_embedded_play('fortune-gem',gen_random_uuid(),'normal');
    raise exception 'maintenance bypass';
  exception when raise_exception then if sqlerrm<>'GAME_UNAVAILABLE' then raise; end if;
  end;
end $test$;
