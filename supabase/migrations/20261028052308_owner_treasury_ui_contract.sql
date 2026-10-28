-- Staging treasury UI contract. Preserve the existing atomic financial engine.
CREATE OR REPLACE FUNCTION phase3.recharge_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=phase3.actor();management boolean:=(phase3.admin_session()->>'canManageRechargeAgencies')::boolean;own boolean:=phase3.is_owner();
begin
 return jsonb_build_object('isOwner',own,'canManage',management,'treasury',coalesce((select coins from phase3.treasury_accounts where user_id=u),0),'issued',case when own then (select issued from phase3.coin_issuance where singleton) else null end,
 'agencies',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'owner_id',owner_id,'is_active',is_active,'is_own_treasury',owner_id=u,'treasury',case when own then coalesce((select t.coins from phase3.treasury_accounts t where t.user_id=agencies.owner_id),0) else null end)),'[]') from public.agencies where kind='recharge' and (is_active or owner_id=u or management)),
 'packages',(select coalesce(jsonb_agg(to_jsonb(p) order by price_usd),'[]') from public.recharge_packages p where is_active),
 'requests',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from (select q.* from public.recharge_requests q join public.agencies a on a.id=q.agency_id where q.user_id=u or a.owner_id=u or management order by q.created_at desc limit 100) r),
 'claims',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from (select * from public.recharge_reward_claims where user_id=u order by created_at desc limit 100) c),
 'fulfillment',(select coalesce(jsonb_agg(to_jsonb(f)),'[]') from (select * from public.reward_fulfillment where user_id=u or management order by created_at desc limit 100) f),
 'ledger',(select coalesce(jsonb_agg(to_jsonb(l)),'[]') from (select * from phase3.treasury_ledger where user_id=u order by created_at desc limit 100) l));
end $function$
;
CREATE OR REPLACE FUNCTION public.phase4_owner_topup_by_id(p_public_id integer, p_coins bigint, p_note text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=auth.uid();v_target uuid;v_name text;v_op uuid;v_treasury bigint;v_wallet bigint;v_prior public.financial_operations%rowtype;v_payload jsonb;v_result jsonb;
begin
 if v_actor is null or not phase3.is_owner() then raise exception 'Owner only' using errcode='42501';end if;
 if p_request_id is null or p_public_id is null or p_coins is null or p_coins not between 1 and 1000000000 or length(btrim(coalesce(p_note,''))) not between 10 and 500 then raise exception 'Valid recipient, amount and documented reason required';end if;
 perform pg_advisory_xact_lock(hashtextextended('owner-topup:'||v_actor::text,0));
 v_payload:=jsonb_build_object('public_id',p_public_id,'coins',p_coins,'note',btrim(p_note));
 select * into v_prior from public.financial_operations where actor_id=v_actor and request_id=p_request_id;
 if found then
  if v_prior.operation<>'owner_topup_by_id' or v_prior.payload<>v_payload then raise exception 'Idempotency conflict';end if;
  return v_prior.result||jsonb_build_object('id',v_prior.id);
 end if;
 select id,display_name into v_target,v_name from public.profiles where public_id=p_public_id;
 if v_target is null then raise exception 'Recipient ID not found';end if;
 if not exists(select 1 from auth.users where id=v_target and email_confirmed_at is not null and deleted_at is null and not is_anonymous and (banned_until is null or banned_until<now())) then raise exception 'Verified recipient required';end if;
 insert into public.wallets(user_id) values(v_target) on conflict(user_id) do nothing;
 insert into phase3.treasury_accounts(user_id) values(v_actor) on conflict(user_id) do nothing;
 perform user_id from public.wallets where user_id=v_target for update;
 update phase3.treasury_accounts set coins=coins-p_coins,updated_at=now() where user_id=v_actor and coins>=p_coins returning coins into v_treasury;
 if not found then raise exception 'Insufficient treasury balance';end if;
 update public.wallets set coins=coins+p_coins,updated_at=now() where user_id=v_target and coins<=9007199254740991-p_coins returning coins into v_wallet;
 if not found then raise exception 'Recipient balance limit exceeded';end if;
 v_result:=jsonb_build_object('status','completed','recipient_id',p_public_id,'recipient_name',v_name,'coins',p_coins,'treasury_balance',v_treasury,'wallet_balance',v_wallet);
 insert into public.financial_operations(actor_id,request_id,operation,payload,result) values(v_actor,p_request_id,'owner_topup_by_id',v_payload,v_result) returning id into v_op;
 insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after) values(v_actor,v_op,-p_coins,v_treasury);
 insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind) values(v_target,'coins',p_coins,v_wallet,gen_random_uuid(),v_op,'agent_topup');
 insert into public.security_audit(actor_id,operation_id,action,details) values(v_actor,v_op,'owner_topup_by_id',v_payload||v_result);
 v_result:=v_result||jsonb_build_object('id',v_op);
 update public.financial_operations set result=v_result where id=v_op;
 return v_result;
end $function$
;
create or replace function public.phase4_owner_recipient(p_public_id integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare answer jsonb;
begin
 if auth.uid() is null or not phase3.is_owner() then
  raise exception 'Owner only' using errcode='42501';
 end if;
 if p_public_id is null or p_public_id<1 then raise exception 'Invalid public ID'; end if;
 select jsonb_build_object('public_id',p.public_id,'display_name',p.display_name)
 into answer from public.profiles p join auth.users u on u.id=p.id
 where p.public_id=p_public_id and u.email_confirmed_at is not null
 and u.deleted_at is null and not coalesce(u.is_anonymous,false)
 and (u.banned_until is null or u.banned_until<now());
 if answer is null then raise exception 'Verified recipient not found'; end if;
 return answer;
end;
$$;
revoke all on function public.phase4_owner_recipient(integer) from public, anon;
grant execute on function public.phase4_owner_recipient(integer) to authenticated;
notify pgrst, 'reload schema';
