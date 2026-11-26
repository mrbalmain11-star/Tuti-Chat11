do $test$
declare actor_id uuid; sid uuid; issue_time timestamptz;
begin
  select v.user_id,v.session_id into strict actor_id,sid
  from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
  join public.profiles p on p.id=v.user_id join auth.users u on u.id=v.user_id
  where (u.banned_until is null or u.banned_until<=now())
    and v.user_id not in (select actor from toti_games.embedded_health)
  limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_id,'role','authenticated','session_id',sid)::text,true);
  assert not has_table_privilege('authenticated','toti_games.embedded_health','select');
  assert not has_table_privilege('authenticated','toti_games.embedded_health','insert');
  assert not has_function_privilege('anon','public.totichat_embedded_report_issue(text,text)','execute');
  assert not has_function_privilege('anon','public.totichat_embedded_health()','execute');
  perform public.totichat_embedded_report_issue('royal-cars','screen');
  select seen_at into strict issue_time from toti_games.embedded_health where actor=actor_id and code='royal-cars' and kind='screen';
  perform public.totichat_embedded_report_issue('royal-cars','screen');
  assert (select seen_at from toti_games.embedded_health where actor=actor_id and code='royal-cars' and kind='screen')=issue_time;
  if coalesce(phase3.admin_section_allowed('games.manage'),false) then
    assert jsonb_typeof(public.totichat_embedded_health())='array';
  else
    begin
      perform public.totichat_embedded_health();
      raise exception 'health report visible without permission';
    exception when insufficient_privilege then null;
    end;
  end if;
end $test$;
