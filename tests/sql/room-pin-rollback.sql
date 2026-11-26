do $test$
declare
  room_value uuid; owner_value uuid; owner_session uuid; guest uuid; guest_session uuid;
  attempt integer; response jsonb;
begin
  select r.id,r.owner_id,v.session_id into strict room_value,owner_value,owner_session
  from public.rooms r join otp_private.verified_sessions v on v.user_id=r.owner_id
  join auth.sessions s on s.id=v.session_id join auth.users u on u.id=r.owner_id
  where not r.is_private and (u.banned_until is null or u.banned_until<=now()) limit 1;
  select v.user_id,v.session_id into strict guest,guest_session from otp_private.verified_sessions v
  join auth.sessions s on s.id=v.session_id join public.profiles p on p.id=v.user_id join auth.users u on u.id=v.user_id
  where v.user_id<>owner_value and (u.banned_until is null or u.banned_until<=now())
    and not exists(select 1 from public.room_members m where m.room_id=room_value and m.user_id=v.user_id)
    and not exists(select 1 from public.room_bans b where b.room_id=room_value and b.user_id=v.user_id and (b.expires_at is null or b.expires_at>now()))
  limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_value,'role','authenticated','session_id',owner_session)::text,true);
  assert public.totichat_room_set_pin(room_value,'012345');
  assert (select access_locked from public.rooms where id=room_value);
  assert (public.shared_room_info(room_value)->>'access_locked')::boolean;
  assert (select (item->>'access_locked')::boolean from public.rooms r
    cross join lateral jsonb_array_elements(public.directory_search('rooms',r.public_id::text)) item
    where r.id=room_value and item->>'id'=room_value::text);
  assert public.phase2_room_join(room_value);
  perform public.phase2_room_leave(room_value);
  assert (select access_locked from public.rooms where id=room_value);
  assert not has_schema_privilege('authenticated','room_pin','usage');
  assert not has_function_privilege('anon','public.totichat_room_enter_with_pin(uuid,text)','execute');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',guest,'role','authenticated','session_id',guest_session)::text,true);
  begin
    perform public.totichat_room_set_pin(room_value,'600000');
    raise exception 'non-owner changed PIN';
  exception when insufficient_privilege then if sqlerrm<>'ROOM_PIN_OWNER_REQUIRED' then raise; end if; end;
  begin
    perform public.phase2_room_join(room_value);
    raise exception 'PIN-less join accepted';
  exception when insufficient_privilege then if sqlerrm<>'ROOM_PIN_REQUIRED' then raise; end if; end;
  begin
    insert into public.room_members(room_id,user_id) values(room_value,guest);
    raise exception 'direct membership accepted';
  exception when insufficient_privilege then if sqlerrm<>'ROOM_PIN_REQUIRED' then raise; end if; end;
  begin
    perform public.phase2_voice_token_preflight(room_value);
    raise exception 'voice before admission';
  exception when insufficient_privilege then if sqlerrm<>'ROOM_MEMBERSHIP_REQUIRED' then raise; end if; end;
  for attempt in 1..5 loop
    response:=public.totichat_room_enter_with_pin(room_value,'999999');
    assert response->>'status'='wrong';
  end loop;
  assert (response->>'seconds')::integer=60;
  assert public.totichat_room_enter_with_pin(room_value,'012345')->>'status'='wait';
  update room_pin.attempts set retry_at=clock_timestamp()-interval '1 second' where room_id=room_value and actor=guest;
  assert public.totichat_room_enter_with_pin(room_value,'012345')->>'status'='joined';
  assert public.phase2_voice_token_preflight(room_value)->>'roomId'=room_value::text;
  perform public.phase2_room_leave(room_value);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_value,'role','authenticated','session_id',owner_session)::text,true);
  assert public.totichat_room_set_pin(room_value,'765432');
  assert public.totichat_room_set_pin(room_value,'000002');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',guest,'role','authenticated','session_id',guest_session)::text,true);
  assert public.totichat_room_enter_with_pin(room_value,'012345')->>'status'='wrong';
  assert public.totichat_room_enter_with_pin(room_value,'765432')->>'status'='wrong';
  assert public.totichat_room_enter_with_pin(room_value,'000002')->>'status'='joined';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_value,'role','authenticated','session_id',owner_session)::text,true);
  assert not public.totichat_room_set_pin(room_value,null);
  assert not (select access_locked from public.rooms where id=room_value);
  assert not (public.shared_room_info(room_value)->>'access_locked')::boolean;
end $test$;
