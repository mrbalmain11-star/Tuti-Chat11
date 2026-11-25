-- Run after applying the migration inside a transaction and roll it back.
do $check$
declare
  actor uuid;
  verified_session uuid;
  target uuid;
  target_number integer;
  request uuid := gen_random_uuid();
  snapshot jsonb;
  reset_result jsonb;
  treasury_before bigint;
  history_before bigint;
begin
  select a.owner_id,s.id into strict actor,verified_session
    from phase3.system_authority a join otp_private.verified_sessions v on v.user_id=a.owner_id
    join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
    where a.singleton limit 1;
  select p.id,p.public_id into strict target,target_number
    from public.profiles p join public.wallets w on w.user_id=p.id
    where p.id<>actor and p.public_id between 100000 and 999999
      and not exists(select 1 from toti_games.entries e where e.player=p.id and e.status='pending')
    order by w.diamonds desc limit 1;
  select coins into treasury_before from phase3.treasury_accounts where user_id=actor;
  select count(*) into history_before from public.gift_events;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','session_id',verified_session)::text,true);
  snapshot := public.owner_account_reset_preview(target_number);
  assert snapshot->>'id'=target::text;
  reset_result := public.owner_reset_test_account(target,target_number,snapshot,'Rollback-only integration test',request);
  assert reset_result->>'status'='completed';
  assert reset_result=public.owner_reset_test_account(target,target_number,snapshot,'Rollback-only integration test',request);
  assert (select coins=0 and diamonds=0 from public.wallets where user_id=target);
  assert (select coins from phase3.treasury_accounts where user_id=actor)=treasury_before+(snapshot->>'coins')::bigint;
  assert (select count(*) from public.gift_events)=history_before;
  assert not exists(select 1 from public.diamond_lots where user_id=target and remaining>0);
  assert not exists(select 1 from public.royal_equipped_frames where subject_id=target and scope='personal');
  assert (public.owner_account_reset_preview(target_number)->>'wealth_xp')::bigint=0;
  assert (public.owner_account_reset_preview(target_number)->>'charm_xp')::bigint=0;
  assert not has_function_privilege('anon','public.owner_reset_test_account(uuid,integer,jsonb,text,uuid)','execute');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',target,'role','authenticated')::text,true);
  begin
    perform public.owner_account_reset_preview(target_number);
    raise exception 'non-owner was allowed';
  exception when insufficient_privilege then null;
  end;
end $check$;
