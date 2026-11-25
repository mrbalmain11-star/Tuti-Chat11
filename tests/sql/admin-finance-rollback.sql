do $test$
declare
  owner_id_value uuid; sid uuid; member_id uuid; agent_id uuid;
  source_before bigint; target_before bigint; agent_before bigint;
  ref uuid; request uuid:=gen_random_uuid(); balances jsonb;
begin
  select owner_id into strict owner_id_value from phase3.system_authority where singleton;
  select v.session_id into strict sid from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id
    where v.user_id=owner_id_value limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id_value,'role','authenticated','session_id',sid)::text,true);
  assert public.otp_access_allowed();
  assert not has_table_privilege('authenticated','toti_finance.pools','insert,update,delete');
  assert not has_function_privilege('anon','public.totichat_finance_post(uuid,text,text,text,text,text,uuid,uuid)','execute');
  assert not has_function_privilege('authenticated','public.phase4_owner_topup_by_id(integer,bigint,text,uuid)','execute');
  assert (select coins from toti_games.treasury where singleton)=0;
  select coins into strict source_before from phase3.treasury_accounts where user_id=owner_id_value;
  ref:=public.totichat_finance_post(request,'issue','issuance','treasury','31','اختبار إصدار الخزينة');
  assert public.totichat_finance_post(request,'issue','issuance','treasury','31','اختبار إصدار الخزينة')=ref;
  assert (select coins from phase3.treasury_accounts where user_id=owner_id_value)=source_before+31;
  perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','games','100','اختبار تمويل ألعاب');
  perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','accounts','300','اختبار تمويل حسابات');
  perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','agents','200','اختبار تمويل وكلاء');
  ref:=public.totichat_finance_post(gen_random_uuid(),'transfer','games','accounts','19','اختبار تحويل محافظ');
  perform public.totichat_finance_post(gen_random_uuid(),'reverse','accounts','games','19','اختبار عكس تحويل',null,ref);
  assert (select coins from toti_games.treasury where singleton)=100;
  update toti_games.treasury set reserved=95 where singleton;
  begin
    perform public.totichat_finance_post(gen_random_uuid(),'withdraw','games','treasury','6','اختبار الحجز');
    raise exception 'reserved coins withdrawn';
  exception when raise_exception then if sqlerrm<>'FINANCE_BALANCE_UNAVAILABLE' then raise; end if;
  end;
  update toti_games.treasury set reserved=0 where singleton;
  perform public.totichat_finance_post(gen_random_uuid(),'withdraw','games','treasury','100','اختبار سحب ألعاب');
  assert (select coins from toti_games.treasury where singleton)=0;
  select p.id,w.coins into strict member_id,target_before from public.profiles p join public.wallets w on w.user_id=p.id
    join auth.users u on u.id=p.id where p.id<>owner_id_value and p.onboarding_completed and u.email_confirmed_at is not null
      and u.deleted_at is null and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now()) limit 1;
  request:=gen_random_uuid();
  ref:=public.totichat_finance_post(request,'charge','accounts','user','21','اختبار شحن مستخدم',member_id);
  assert public.totichat_finance_post(request,'charge','accounts','user','21','اختبار شحن مستخدم',member_id)=ref;
  assert (select coins from public.wallets where user_id=member_id)=target_before+21;
  select a.owner_id,coalesce(t.coins,0) into strict agent_id,agent_before from public.agencies a
    join public.profiles p on p.id=a.owner_id join auth.users u on u.id=a.owner_id
    left join phase3.treasury_accounts t on t.user_id=a.owner_id
    where a.kind='recharge' and a.is_active and a.owner_id<>owner_id_value and p.onboarding_completed
      and u.email_confirmed_at is not null and u.deleted_at is null and not coalesce(u.is_anonymous,false)
      and (u.banned_until is null or u.banned_until<=now()) limit 1;
  perform public.totichat_finance_post(gen_random_uuid(),'charge','agents','agent','20','اختبار شحن وكيل',agent_id);
  assert (select coins from phase3.treasury_accounts where user_id=agent_id)=agent_before+20;
  begin
    perform public.totichat_finance_post(gen_random_uuid(),'charge','accounts','user','1.5','اختبار رفض الكسور',member_id);
    raise exception 'fraction accepted';
  exception when raise_exception then if sqlerrm<>'FINANCE_INVALID_REQUEST' then raise; end if;
  end;
  balances:=public.totichat_finance_overview();
  assert balances->'balances'->>'accounts'='279';
  assert balances->'balances'->>'agents'='180';
  assert jsonb_array_length(public.totichat_finance_ledger())>=8;
  assert not exists(select 1 from toti_finance.postings group by operation_id having count(*)<>2 or sum(amount)<>0);
end $test$;

do $delegation$
declare
  owner_id_value uuid; owner_session uuid; staff_id uuid; staff_session uuid; staff_public integer;
begin
  select owner_id into strict owner_id_value from phase3.system_authority where singleton;
  select v.session_id into strict owner_session from otp_private.verified_sessions v join auth.sessions s on s.id=v.session_id
    where v.user_id=owner_id_value limit 1;
  select p.id,v.session_id,p.public_id into staff_id,staff_session,staff_public
  from phase3.admin_access a join public.profiles p on p.id=a.user_id
  join otp_private.verified_sessions v on v.user_id=p.id join auth.sessions s on s.id=v.session_id
  join auth.users u on u.id=p.id
  where a.role in ('admin','super_admin') and (u.banned_until is null or u.banned_until<=now()) limit 1;
  if staff_id is null then
    select p.id,v.session_id,p.public_id into strict staff_id,staff_session,staff_public
    from public.profiles p join auth.users u on u.id=p.id join otp_private.verified_sessions v on v.user_id=p.id
    join auth.sessions s on s.id=v.session_id
    where p.id<>owner_id_value and (u.banned_until is null or u.banned_until<=now())
      and not exists(select 1 from phase3.admin_access a where a.user_id=p.id) limit 1;
    insert into phase3.admin_access(user_id,role,permissions,assigned_by)
    values(staff_id,'admin',array[]::text[],owner_id_value);
  end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'role','authenticated','session_id',staff_session)::text,true);
  assert public.otp_access_allowed();
  begin
    perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','accounts','1','تحقق منع صلاحية');
    raise exception 'staff inherited financial permissions';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id_value,'role','authenticated','session_id',owner_session)::text,true);
  perform public.totichat_finance_delegate(staff_public,array['accounts.read','accounts.fund'],2);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'role','authenticated','session_id',staff_session)::text,true);
  begin
    perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','accounts','3','تحقق سقف التفويض');
    raise exception 'staff exceeded financial limit';
  exception when raise_exception then if sqlerrm<>'FINANCE_LIMIT' then raise; end if;
  end;
  perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','accounts','2','تحقق من التفويض');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id_value,'role','authenticated','session_id',owner_session)::text,true);
  perform public.totichat_finance_delegate(staff_public,array[]::text[],null);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'role','authenticated','session_id',staff_session)::text,true);
  begin
    perform public.totichat_finance_post(gen_random_uuid(),'fund','treasury','accounts','1','تحقق سحب التفويض');
    raise exception 'revoked staff still has permission';
  exception when insufficient_privilege then null;
  end;
end $delegation$;
