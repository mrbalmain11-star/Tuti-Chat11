create or replace function public.staging_gift_vip(p_recipient text, p_tier integer, p_price bigint, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_sender uuid := auth.uid();
  v_recipient uuid;
  v_price bigint;
  v_balance bigint;
  v_expires timestamptz;
  v_payload jsonb;
  v_previous phase3.vip_action_requests%rowtype;
  v_result jsonb;
begin
  if v_sender is null or public.otp_access_allowed() is not true then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode = '42501';
  end if;
  v_price := (array[20000,60000,200000,600000,1500000,3500000,8000000,18000000,35000000,70000000,120000000,200000000]::bigint[])[p_tier];
  if v_price is null or p_price is distinct from v_price or p_request_id is null then
    raise exception 'VIP_GIFT_INVALID_PRICE_OR_TIER' using errcode = '22023';
  end if;
  p_recipient := lower(btrim(p_recipient));
  if p_recipient ~ '^[0-9]{1,9}$' then
    select id into v_recipient from public.profiles where public_id = p_recipient::bigint;
  elsif p_recipient ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select id into v_recipient from public.profiles where id = p_recipient::uuid;
  end if;
  if v_recipient is null or v_recipient = v_sender then
    raise exception 'VIP_GIFT_INVALID_RECIPIENT' using errcode = '22023';
  end if;

  v_payload := jsonb_build_object('action','gift','recipient',v_recipient,'tier',p_tier,'price',v_price);
  select coins into v_balance from public.wallets where user_id = v_sender for update;
  select * into v_previous from phase3.vip_action_requests where actor_id = v_sender and request_id = p_request_id;
  if found then
    if v_previous.payload is distinct from v_payload then
      raise exception 'VIP_GIFT_REQUEST_CONFLICT' using errcode = '22023';
    end if;
    return v_previous.result;
  end if;
  if v_balance is null or v_balance < v_price then raise exception 'VIP_GIFT_INSUFFICIENT_COINS'; end if;

  insert into public.vip_entitlements as e (user_id,tier,expires_at,granted_by)
  values (v_recipient,p_tier,now()+interval '30 days',v_sender)
  on conflict (user_id) do update set
    tier = excluded.tier,
    expires_at = greatest(coalesce(e.expires_at, now()),now()) + interval '30 days',
    granted_by = excluded.granted_by,
    updated_at = now()
  where e.tier = 0 or e.expires_at <= now() or (e.expires_at is not null and e.tier <= excluded.tier)
  returning expires_at into v_expires;
  if not found then raise exception 'VIP_GIFT_RECIPIENT_ALREADY_HAS_VIP'; end if;

  update public.wallets set coins = coins - v_price, updated_at = now()
  where user_id = v_sender returning coins into v_balance;
  insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,kind)
  values (v_sender,'coins',-v_price,v_balance,p_request_id,'vip_purchase');
  v_result := jsonb_build_object('success',true,'tier',p_tier,'coins',v_balance,'expiresAt',v_expires);
  insert into phase3.vip_action_requests(actor_id,request_id,payload,result)
  values(v_sender,p_request_id,v_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.staging_gift_vip(text,integer,bigint,uuid) from public,anon;
grant execute on function public.staging_gift_vip(text,integer,bigint,uuid) to authenticated;
