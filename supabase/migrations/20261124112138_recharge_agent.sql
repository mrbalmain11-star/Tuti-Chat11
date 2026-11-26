begin;

create index recharge_agent_operations on public.financial_operations (actor_id, created_at desc, id desc)
where operation in ('agent_direct_topup','agent_supply_request');
create index recharge_agent_pending_supply on public.financial_operations (created_at, id)
where operation='agent_supply_request' and status='pending';

create view phase3.agent_recharge_history with (security_invoker = true) as
 select f.id,f.actor_id,f.created_at,f.status,(f.payload->>'coins')::bigint as coins,f.result
 from public.financial_operations f where f.operation='agent_direct_topup'
 union all
 select f.id,f.actor_id,f.created_at,f.status,q.coins,
   jsonb_build_object('recipient',jsonb_build_object('public_id',p.public_id,'display_name',p.display_name,
     'avatar_url',p.avatar_url,'gender',p.gender))
 from public.financial_operations f join public.recharge_requests q on q.id=(f.result->>'request_id')::uuid
 left join public.profiles p on p.id=q.user_id
 where f.operation='recharge_action' and f.payload->>'action' in ('approve','reject')
 and f.status in ('completed','failed');

revoke all on phase3.agent_recharge_history from public,anon,authenticated;

create function phase3.agent_recharge_recipient(p_id integer) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'public_id',p.public_id,'display_name',p.display_name,
   'avatar_url',p.avatar_url,'gender',p.gender,
   'vip_level',coalesce((select max(e.tier) from public.vip_entitlements e
      where e.user_id=p.id and (e.expires_at is null or e.expires_at>now())),0),
   'level',public.staging_royal_level_for_xp(coalesce((select sum(g.amount)::bigint
      from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
      where g.sender_id=p.id),0)))
 from public.profiles p join auth.users u on u.id=p.id
 where p_id between 100000 and 999999 and p.public_id=p_id and p.onboarding_completed and u.email_confirmed_at is not null
 and u.deleted_at is null and not coalesce(u.is_anonymous,false)
 and (u.banned_until is null or u.banned_until<=now())
$$;

create function phase3.agent_recharge(p_action text,p_data jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := phase3.actor();
 agency_id uuid;
 recipient jsonb;
 target uuid;
 amount bigint;
 treasury bigint;
 wallet bigint;
 operation_id uuid;
 prior public.financial_operations%rowtype;
 transfer_status text := 'completed';
 answer jsonb;
 note text := btrim(p_data->>'note');
 day_start timestamptz := date_trunc('day',now(),'Asia/Baghdad');
 month_start timestamptz := date_trunc('month',now(),'Asia/Baghdad');
 page_offset integer;
begin
 if p_action in ('admin_list','approve_supply','reject_supply') then
   if not phase3.is_owner() then raise exception 'AGENT_OWNER_REQUIRED' using errcode='42501'; end if;
   if p_action='admin_list' then
     return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at,s.id),'[]') from
       (select f.id,f.created_at,(f.payload->>'coins')::bigint as coins,a.name as agency_name
       from public.financial_operations f left join public.agencies a on a.id=(f.payload->>'agency_id')::uuid
       where f.operation='agent_supply_request' and f.status='pending' order by f.created_at,f.id limit 50) s);
   end if;
   if coalesce(char_length(note),0) not between 10 and 500 then raise exception 'AGENT_NOTE_REQUIRED'; end if;
   select * into prior from public.financial_operations
     where id=(p_data->>'id')::uuid and operation='agent_supply_request' for update;
   if not found then raise exception 'AGENT_REQUEST_NOT_FOUND'; end if;
   if prior.status<>'pending' then return prior.result; end if;
   if p_action='approve_supply' then
     if not exists(select 1 from public.agencies a where a.id=(prior.payload->>'agency_id')::uuid
       and a.owner_id=prior.actor_id and a.kind='recharge' and a.is_active for share) then
       raise exception 'AGENT_NOT_APPROVED';
     end if;
     answer := phase3.recharge_action('allocate',prior.payload||jsonb_build_object('note',note),prior.id);
   else
     transfer_status := 'failed';
     answer := '{}'::jsonb;
   end if;
   answer := answer||jsonb_build_object('status',transfer_status,'note',note);
   update public.financial_operations set status=transfer_status,result=answer where id=prior.id;
   insert into public.security_audit(actor_id,operation_id,action,details)
     values(actor,prior.id,p_action,answer);
   return answer;
 end if;

 select a.id into agency_id from public.agencies a
   where a.owner_id=actor and a.kind='recharge' and a.is_active order by a.id limit 1 for share;
 if p_action='access' then return to_jsonb(agency_id is not null); end if;
 if agency_id is null then raise exception 'AGENT_NOT_APPROVED' using errcode='42501'; end if;

 if p_action='state' then
   return (select jsonb_build_object(
     'balance',coalesce((select t.coins from phase3.treasury_accounts t where t.user_id=actor),0),
     'count',count(*),
     'today',coalesce(sum(coins) filter (where created_at>=day_start),0),
     'month',coalesce(sum(coins) filter (where created_at>=month_start),0))
     from phase3.agent_recharge_history where actor_id=actor and status='completed');
 end if;
 if p_action in ('history','supplies') then
   page_offset := greatest(0,least(100000,coalesce((p_data->>'offset')::integer,0)));
   return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc,s.id desc),'[]') from
     (select id,status,created_at,coins,result from (
       select id,status,created_at,coins,result from phase3.agent_recharge_history
        where p_action='history' and actor_id=actor
       union all
       select id,status,created_at,(payload->>'coins')::bigint as coins,result from public.financial_operations
        where p_action='supplies' and actor_id=actor and operation='agent_supply_request'
      ) records order by created_at desc,id desc limit 30 offset page_offset) s);
 end if;
 if p_action='lookup' then
   return phase3.agent_recharge_recipient((p_data->>'public_id')::integer);
 end if;
 if p_action is null or p_action not in ('charge','request_supply') or p_request_id is null then
   raise exception 'AGENT_INVALID_REQUEST';
 end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'AGENT_INVALID_REQUEST'; end if;
 if p_action='charge' then
   p_data := jsonb_build_object('coins',(p_data->>'coins')::bigint,'public_id',(p_data->>'public_id')::integer,
     'recipient_id',(p_data->>'recipient_id')::uuid);
 else
   p_data := jsonb_build_object('coins',(p_data->>'coins')::bigint);
 end if;
 amount := (p_data->>'coins')::bigint;
 if amount is null or amount not between 1 and 1000000000 then raise exception 'AGENT_INVALID_AMOUNT'; end if;
 select * into prior from public.financial_operations where actor_id=actor and request_id=p_request_id;
 if found then
   if prior.operation is distinct from (case when p_action='charge' then 'agent_direct_topup' else 'agent_supply_request' end)
      or (prior.payload - 'agency_id') is distinct from p_data then raise exception 'AGENT_RETRY_CONFLICT'; end if;
   return prior.result;
 end if;
 if (select count(*) from public.financial_operations where actor_id=actor and created_at>now()-interval '1 minute')>=30 then
   raise exception 'AGENT_RATE_LIMIT';
 end if;
 if p_action='request_supply' then
   if (select count(*) from public.financial_operations where actor_id=actor and operation='agent_supply_request' and status='pending')>=5 then
     raise exception 'AGENT_PENDING_LIMIT';
   end if;
   insert into public.financial_operations(actor_id,request_id,operation,payload,status)
     values(actor,p_request_id,'agent_supply_request',p_data||jsonb_build_object('agency_id',agency_id),'pending')
     returning id into operation_id;
   answer := jsonb_build_object('id',operation_id,'status','pending');
   update public.financial_operations set result=answer where id=operation_id;
   insert into public.security_audit(actor_id,operation_id,action,details)
     values(actor,operation_id,'agent_supply_requested',p_data||answer);
   return answer;
 end if;

 recipient := phase3.agent_recharge_recipient((p_data->>'public_id')::integer);
 target := (recipient->>'id')::uuid;
 if target is null or target is distinct from (p_data->>'recipient_id')::uuid then raise exception 'AGENT_RECIPIENT_CHANGED'; end if;
 if target=actor then raise exception 'AGENT_SELF_CHARGE'; end if;
 select w.coins into wallet from public.wallets w where w.user_id=target for update;
 select t.coins into treasury from phase3.treasury_accounts t where t.user_id=actor for update;
 treasury := coalesce(treasury,0);
 answer := jsonb_build_object('recipient',recipient-'id');
 if treasury<amount or wallet is null or wallet>9007199254740991-amount then
   transfer_status := 'failed';
   answer := answer||jsonb_build_object('error',case when treasury<amount then 'AGENT_INSUFFICIENT' when wallet is null then 'AGENT_WALLET_MISSING' else 'AGENT_WALLET_LIMIT' end);
 else
   update phase3.treasury_accounts set coins=coins-amount,updated_at=now() where user_id=actor returning coins into treasury;
   update public.wallets set coins=coins+amount,updated_at=now() where user_id=target returning coins into wallet;
 end if;
 insert into public.financial_operations(actor_id,request_id,operation,payload,status)
   values(actor,p_request_id,'agent_direct_topup',p_data,transfer_status) returning id into operation_id;
 if transfer_status='completed' then
   insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after) values(actor,operation_id,-amount,treasury);
   insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind)
     values(target,'coins',amount,wallet,gen_random_uuid(),operation_id,'agent_topup');
 end if;
 answer := answer||jsonb_build_object('id',operation_id,'status',transfer_status,'balance',treasury);
 update public.financial_operations set result=answer where id=operation_id;
 insert into public.security_audit(actor_id,operation_id,action,details)
   values(actor,operation_id,'agent_direct_topup',p_data||answer);
 return answer;
end
$$;

create function public.recharge_agent(p_action text,p_data jsonb default '{}',p_request_id uuid default null) returns jsonb
language sql set search_path='' as $$ select phase3.agent_recharge(p_action,p_data,p_request_id) $$;
revoke all on function phase3.agent_recharge_recipient(integer),phase3.agent_recharge(text,jsonb,uuid),
 public.recharge_agent(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function phase3.agent_recharge(text,jsonb,uuid),public.recharge_agent(text,jsonb,uuid) to authenticated;

commit;
